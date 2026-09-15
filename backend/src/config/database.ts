import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Fix parsing of TIMESTAMP without time zone (OID 1114) to be treated as UTC
types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue + 'Z');
});

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
