@echo off
cd /d "%~dp0"
color 0F
echo =======================================
echo     Subiendo proyecto a GitHub...
echo =======================================
echo.

git init
git config user.name "josfabgom"
git config user.email "josfabgom@users.noreply.github.com"

git add .
git commit -m "Primer commit - ViajesQ a Produccion"
git branch -M main
git remote add origin https://github.com/josfabgom/ViajesQ.git
git push -u origin main

echo.
echo =======================================
echo Si se abrio una ventana en tu navegador pidiendo iniciar sesion,
echo por favor autoriza a GitHub.
echo =======================================
pause
