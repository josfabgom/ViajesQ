const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigration() {
  try {
    await pool.query(`
      ALTER TABLE driver_payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE driver_payments ADD COLUMN IF NOT EXISTS annulled_at TIMESTAMP;
      ALTER TABLE driver_payments ADD COLUMN IF NOT EXISTS annulled_by UUID REFERENCES users(id);

      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          action VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID,
          user_id UUID REFERENCES users(id),
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration successful: driver_payments altered, audit_logs created');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
