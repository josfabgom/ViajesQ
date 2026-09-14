const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({host: '82.25.64.166', username: 'root', password: 'Posadas2026+'})
.then(() => ssh.execCommand('docker exec -i viajesq_prod_db psql -U postgres -d viajesq -c "SELECT email, password_hash FROM users;"'))
.then(res => { console.log(res.stdout); ssh.dispose(); });
