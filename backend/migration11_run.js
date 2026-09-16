const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'viajesq',
});

async function runMigration() {
  try {
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS trip_auto_finish_minutes INTEGER DEFAULT 20;`);
    await pool.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;`);
    console.log('Migration 11 applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    pool.end();
  }
}

runMigration();
