import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../lib/auth.js';
import { UserModel } from '../models/user.js';
import { getDatabase } from '../db/index.js';

export interface AuthContext extends Context {
  user?: JWTPayload;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = getCookie(c, 'token');
    
    if (!token) {
      token = extractTokenFromHeader(c.req.header('Authorization'));
    }

    if (!token) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Verify user still exists
    const db = getDatabase();
    const userModel = new UserModel(db);
    const user = await userModel.findById(payload.userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Add user to context
    c.set('user', payload);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid authentication token' }, 401);
  }
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = getCookie(c, 'token');
    
    if (!token) {
      token = extractTokenFromHeader(c.req.header('Authorization'));
    }

    if (token) {
      try {
        // Verify token
        const payload = verifyToken(token);
        
        // Verify user still exists
        const db = getDatabase();
        const userModel = new UserModel(db);
        const user = await userModel.findById(payload.userId);
        
        if (user) {
          // Add user to context if valid
          c.set('user', payload);
        }
      } catch (error) {
        // Token invalid, but that's okay for optional auth
      }
    }

    await next();
  } catch (error) {
    // Ignore errors for optional auth
    await next();
  }
}