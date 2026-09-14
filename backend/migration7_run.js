const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixDb() {
  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = `
    ALTER TABLE driver_payments ADD COLUMN IF NOT EXISTS period_start DATE;
    ALTER TABLE driver_payments ADD COLUMN IF NOT EXISTS period_end DATE;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/migration7.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/migration7.sql`);
  
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);
  ssh.dispose();
}

fixDb().catch(console.error);
