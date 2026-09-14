$HostingerIP = "82.25.64.166"
$HostingerUser = "root"

try {
    Write-Host "========================================="
    Write-Host "   Despliegue de ViajesQ a Hostinger VPS  "
    Write-Host "========================================="
    Write-Host ""
    
    Write-Host "Paso 1: Comprimiendo el proyecto (esto puede tomar unos segundos)..."
    tar --exclude=backend/node_modules --exclude=frontend/node_modules --exclude=frontend/dist -czf viajesq.tar.gz backend frontend docker-compose.prod.yml
    if ($LASTEXITCODE -ne 0) { throw "Error al comprimir los archivos con tar." }

    Write-Host "Paso 2: Subiendo el archivo al servidor (se te pedirá la contraseña del servidor VPS)..."
    scp viajesq.tar.gz ${HostingerUser}@${HostingerIP}:/root/viajesq.tar.gz
    if ($LASTEXITCODE -ne 0) { throw "Error al subir el archivo con scp. Verifica la contraseña o IP." }

    Write-Host "Paso 3: Extrayendo y levantando contenedores (se te pedirá la contraseña nuevamente)..."
    ssh ${HostingerUser}@${HostingerIP} "mkdir -p /root/viajesq && tar -xzf /root/viajesq.tar.gz -C /root/viajesq && cd /root/viajesq && (docker compose -f docker-compose.prod.yml up -d --build || docker-compose -f docker-compose.prod.yml up -d --build)"
    if ($LASTEXITCODE -ne 0) { throw "Error al ejecutar comandos en el VPS con ssh." }

    Write-Host ""
    Write-Host "========================================="
    Write-Host "¡Despliegue completado con éxito! 🚀"
    Write-Host "Puedes acceder a tu sistema ingresando a: http://$HostingerIP"
    Write-Host "========================================="

    Remove-Item viajesq.tar.gz -ErrorAction SilentlyContinue
} catch {
    Write-Host ""
    Write-Host "❌ OCURRIÓ UN ERROR DURANTE EL PROCESO:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

Read-Host "Presiona Enter para cerrar esta ventana..."
