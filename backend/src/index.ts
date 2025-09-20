import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
// Using Bun's native server instead of @hono/node-server
import { initializeDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import draftRoutes from './routes/drafts.js';

const app = new Hono();

app.use('*', logger());

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Mount auth routes
app.route('/auth', authRoutes);

// Mount draft routes
app.route('/api/posts', draftRoutes);

app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'signify-backend'
  });
});

app.get('/', (c) => {
  return c.json({ 
    message: 'Signify API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      posts: '/posts/*'
    }
  });
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
  console.error('Server error:', err);
  // Ensure we always return JSON even on errors
  return c.json({ 
    success: false,
    error: err instanceof Error ? err.message : 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500);
});

const port = parseInt(process.env.PORT || '3001');

async function startServer() {
  try {
    await initializeDatabase();
    
    console.log(`🚀 Server starting on port ${port}`);
    
    // Use Bun's native server
    Bun.serve({
      port,
      fetch: app.fetch,
    });
    
    console.log(`✅ Server running at http://localhost:${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();