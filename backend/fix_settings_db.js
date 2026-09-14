const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixDb() {
  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = `
    CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        default_lat DECIMAL(10, 8),
        default_lng DECIMAL(11, 8)
    );
    INSERT INTO settings (id, default_lat, default_lng) VALUES (1, -34.6037, -58.3816) ON CONFLICT (id) DO NOTHING;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/migration3.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/migration3.sql`);
  
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);
  ssh.dispose();
}

fixDb().catch(console.error);
