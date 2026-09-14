const { NodeSSH } = require('node-ssh');
const bcrypt = require('bcryptjs');

const ssh = new NodeSSH();

async function fixDb() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const driverHash = await bcrypt.hash('driver123', 10);

  console.log('adminHash', adminHash);

  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = `
    UPDATE users SET password_hash = '${adminHash}' WHERE email = 'admin@viajesq.com';
    UPDATE users SET password_hash = '${driverHash}' WHERE email = 'chofer@viajesq.com';
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/fix.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/fix.sql`);
  
  console.log(res.stdout);
  console.log(res.stderr);
  ssh.dispose();
}

fixDb();
