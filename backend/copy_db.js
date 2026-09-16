const { NodeSSH } = require('node-ssh');
const { execSync } = require('child_process');
const path = require('path');

async function syncDB() {
  const ssh = new NodeSSH();
  try {
    console.log('Conectando al servidor de producción...');
    await ssh.connect({
      host: '82.25.64.166',
      username: 'root',
      password: 'Posadas2026+'
    });

    console.log('Generando volcado (dump) de la base de datos de producción...');
    const dumpRes = await ssh.execCommand('docker exec viajesq_prod_db pg_dump -U postgres -d viajesq --clean > /tmp/viajesq_prod_dump.sql');
    if (dumpRes.code !== 0) {
      throw new Error(`Error en pg_dump: ${dumpRes.stderr}`);
    }

    console.log('Descargando el volcado a la máquina local...');
    const localDumpPath = path.join(__dirname, 'prod_dump.sql');
    await ssh.getFile(localDumpPath, '/tmp/viajesq_prod_dump.sql');
    
    console.log('Volcado descargado. Importando a la base de datos local...');
    // Execute local import using docker
    execSync(`docker exec -i viajesq_db psql -U postgres -d viajesq < "${localDumpPath}"`, { stdio: 'inherit' });
    
    console.log('¡Sincronización completada exitosamente!');
  } catch (error) {
    console.error('Ocurrió un error:', error);
  } finally {
    ssh.dispose();
  }
}

syncDB();
