const { NodeSSH } = require('node-ssh');
const bcrypt = require('bcryptjs');

const ssh = new NodeSSH();

async function insertUsers() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const driverHash = await bcrypt.hash('driver123', 10);

  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = `
    INSERT INTO users (name, email, password_hash, role_id) 
    VALUES ('Administrador', 'admin@viajesq.com', '${adminHash}', (SELECT id FROM roles WHERE name = 'admin'))
    ON CONFLICT (email) DO UPDATE SET password_hash = '${adminHash}';

    INSERT INTO users (name, email, password_hash, role_id) 
    VALUES ('Chofer', 'chofer@viajesq.com', '${driverHash}', (SELECT id FROM roles WHERE name = 'driver'))
    ON CONFLICT (email) DO UPDATE SET password_hash = '${driverHash}';
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/insert.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/insert.sql`);
  
  console.log(res.stdout);
  console.log(res.stderr);
  ssh.dispose();
}

insertUsers();
