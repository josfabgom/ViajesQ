const { Pool } = require('pg');
const pool = new Pool({ port: 5433, user: 'postgres', password: 'postgres', database: 'viajesq' });
pool.query("SELECT '2026-09-15T13:00:00.000Z'::timestamp as ts1, '2026-09-15T13:00:00.000Z'::timestamp with time zone as ts2").then(res => {
  console.log(res.rows[0]);
  process.exit(0);
});
