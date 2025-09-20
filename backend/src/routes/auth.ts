import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { UserModel } from '../models/user.js';
import { generateToken } from '../lib/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { getDatabase } from '../db/index.js';
import { CreateUserRequest, LoginRequest, AuthResponse, ApiResponse } from '../../../shared/types.js';

const auth = new Hono();

// Apply rate limiting to auth endpoints
auth.use('/register', authRateLimit);
auth.use('/login', authRateLimit);

// User registration
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json() as CreateUserRequest;
    const { email, password, display_name } = body;

    // Validate required fields
    if (!email || !password || !display_name) {
      return c.json({ 
        success: false, 
        error: 'Email, password, and display name are required' 
      } as ApiResponse, 400);
    }

    const db = getDatabase();
    const userModel = new UserModel(db);

    // Create user
    const user = await userModel.createUser({ email, password, display_name });

    // Generate JWT token
    const token = generateToken(user);

    // Set httpOnly cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    const response: AuthResponse = {
      user,
      token,
    };

    return c.json({ 
      success: true, 
      data: response,
      message: 'User registered successfully' 
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    
    return c.json({ 
      success: false, 
      error: errorMessage 
    } as ApiResponse, 400);
  }
});

// User login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json() as LoginRequest;
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'Email and password are required' 
      } as ApiResponse, 400);
    }

    const db = getDatabase();
    const userModel = new UserModel(db);

    // Validate user credentials
    const user = await userModel.validatePassword(email, password);
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      } as ApiResponse, 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set httpOnly cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    const response: AuthResponse = {
      user,
      token,
    };

    return c.json({ 
      success: true, 
      data: response,
      message: 'Login successful' 
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Login error:', error);
    
    return c.json({ 
      success: false, 
      error: 'Login failed' 
    } as ApiResponse, 500);
  }
});

// User logout
auth.post('/logout', async (c) => {
  try {
    // Clear the authentication cookie
    deleteCookie(c, 'token');

    return c.json({ 
      success: true, 
      message: 'Logout successful' 
    } as ApiResponse);

  } catch (error) {
    console.error('Logout error:', error);
    
    return c.json({ 
      success: false, 
      error: 'Logout failed' 
    } as ApiResponse, 500);
  }
});

// Get current user info (protected)
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ 
        success: false, 
        error: 'User not found in context' 
      } as ApiResponse, 401);
    }

    const db = getDatabase();
    const userModel = new UserModel(db);
    const user = await userModel.findById(userPayload.userId);

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      } as ApiResponse, 404);
    }

    return c.json({ 
      success: true, 
      data: user 
    } as ApiResponse);

  } catch (error) {
    console.error('Get user error:', error);
    
    return c.json({ 
      success: false, 
      error: 'Failed to get user info' 
    } as ApiResponse, 500);
  }
});

export default auth;