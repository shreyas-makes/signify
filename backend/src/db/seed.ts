import { pool } from './index.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Seeding database with test data...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    await pool.query(`
      INSERT INTO users (email, password_hash, display_name) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['demo@signify.com', hashedPassword, 'Demo User']);

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@signify.com']);
    const userId = userResult.rows[0]?.id;

    if (userId) {
      await pool.query(`
        INSERT INTO posts (user_id, title, content, slug, word_count) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO NOTHING
      `, [
        userId,
        'Welcome to Signify',
        'This is a demo post showing how Signify works. Every character in this post was typed manually and recorded with keystroke timestamps.',
        'welcome-to-signify',
        24
      ]);

      console.log('✅ Database seeded successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();