const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function runMigration() {
  try {
    console.log('Conectando a producción para migración...');
    await ssh.connect({
      host: '82.25.64.166',
      username: 'root',
      password: 'Posadas2026+'
    });

    const sqlPath = path.join(__dirname, 'backend', 'migration10.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await ssh.execCommand(`cat << 'EOF' > /tmp/migration10.sql\n${sqlContent}\nEOF`);
    const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/migration10.sql`);
    
    console.log('Migración STDOUT:', res.stdout);
    if(res.stderr) console.error('Migración STDERR:', res.stderr);
    console.log('Migración en producción completada.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    ssh.dispose();
  }
}

runMigration();
