import { initializeDatabase, closeDatabase } from './index.js';

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    await initializeDatabase();
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

migrate();