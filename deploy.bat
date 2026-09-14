@echo off
cd /d "%~dp0"
color 0F
echo =========================================
echo    Despliegue de ViajesQ a Hostinger VPS  
echo =========================================
echo.
echo Paso 1: Comprimiendo el proyecto (esto puede tomar unos segundos)...
tar --exclude=backend/node_modules --exclude=frontend/node_modules --exclude=frontend/dist -czf viajesq.tar.gz backend frontend docker-compose.prod.yml
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo al comprimir los archivos. Es posible que algun archivo este en uso.
    goto error
)

echo.
echo Paso 2: Subiendo el archivo al servidor (se te pedira la contrasena de tu VPS)...
scp viajesq.tar.gz root@82.25.64.166:/root/viajesq.tar.gz
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo al subir el archivo al servidor. Verifica que introdujiste la contrasena correctamente.
    goto error
)

echo.
echo Paso 3: Extrayendo e instalando en el servidor (se te pedira la contrasena nuevamente)...
ssh root@82.25.64.166 "mkdir -p /root/viajesq && tar -xzf /root/viajesq.tar.gz -C /root/viajesq && cd /root/viajesq && (docker compose -f docker-compose.prod.yml up -d --build || docker-compose -f docker-compose.prod.yml up -d --build)"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo durante la instalacion en el servidor (ssh).
    goto error
)

echo.
echo =========================================
echo Despliegue completado con exito! 
echo Puedes acceder a tu sistema ingresando a: http://82.25.64.166
echo =========================================
del viajesq.tar.gz >nul 2>&1
pause
exit /b

:error
echo.
echo =========================================
echo X OCURRIO UN ERROR DURANTE EL PROCESO X
echo =========================================
pause
exit /b
