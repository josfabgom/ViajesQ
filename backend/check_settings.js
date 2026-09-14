const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDb() {
  await ssh.connect({
    host: '82.25.64.166',
    username: 'root',
    password: 'Posadas2026+'
  });

  const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq -c "SELECT * FROM settings;"`);
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);

  ssh.dispose();
}

checkDb().catch(console.error);
