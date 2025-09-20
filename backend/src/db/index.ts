import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/signify_dev';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export function getDatabase(): Pool {
  return pool;
}

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Database connected successfully');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Database schema initialized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Make sure PostgreSQL is running and database "signify_dev" exists');
    console.log('💡 Run: createdb signify_dev');
    throw error;
  }
}

export async function closeDatabase() {
  await pool.end();
  console.log('Database connection closed');
}

process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);