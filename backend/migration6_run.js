const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixDb() {
  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const query = `
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_id UUID;
    
    CREATE TABLE IF NOT EXISTS driver_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        driver_id UUID REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/migration6.sql\n${query}\nEOF`);
  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/migration6.sql`);
  
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);
  ssh.dispose();
}

fixDb().catch(console.error);
