const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function fix() {
  await pool.query(`UPDATE trips SET status='completed', ended_at=CURRENT_TIMESTAMP WHERE status='in_progress' AND (started_at IS NULL OR started_at <= NOW() - interval '20 minutes')`);
  console.log('Fixed stuck trips locally');
  await pool.end();
}

fix();
