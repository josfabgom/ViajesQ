const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({host: '82.25.64.166', username: 'root', password: 'Posadas2026+'})
.then(async () => {
    const query = `UPDATE users SET password_hash = '$2b$10$uI9ENVt1CrJ35qK78taxNerkNkmwsDehkEdxuKeZwxAfRdDYAEldW' WHERE email = 'admin@viajesq.com';`;
    await ssh.execCommand(`cat << 'EOF' > /tmp/update_admin.sql\n${query}\nEOF`);
    const res = await ssh.execCommand(`docker exec -i viajesq_prod_db psql -U postgres -d viajesq < /tmp/update_admin.sql`);
    console.log('Update result:', res.stdout);
    console.log('Update error:', res.stderr);
    ssh.dispose();
})
.catch(err => { console.error('Error:', err); ssh.dispose(); });
