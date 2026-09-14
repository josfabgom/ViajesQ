const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function fixDb() {
  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = fs.readFileSync('./init.sql', 'utf8');

  await ssh.execCommand(`cat << 'EOF' > /tmp/init.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/init.sql`);
  
  // also add columns for payment_status safely just in case table existed but not columns
  const alterQuery = `
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_id UUID;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/migration_alter.sql\n${alterQuery}\nEOF`);
  const res2 = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/migration_alter.sql`);

  console.log('STDOUT1:', res.stdout);
  console.log('STDERR1:', res.stderr);
  console.log('STDOUT2:', res2.stdout);
  console.log('STDERR2:', res2.stderr);
  ssh.dispose();
}

fixDb().catch(console.error);
