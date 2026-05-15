@echo off
echo ========================================
echo   SUBIENDO EDP DASHBOARD A GITHUB
echo ========================================
echo.

:: Inicializar si no existe
if not exist .git (
    git init
)

:: Configurar rama principal
git branch -M main

:: Agregar archivos
git add .

:: Commit
git commit -m "Initial commit: Dashboard tactical interface"

:: Vincular remoto (si ya existe lo borramos para asegurar el nuevo)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/ignaciomartioda-web/le-pen-maqueta.git

:: Subir
echo.
echo Intentando subir a GitHub...
git push -u origin main

echo.
echo ========================================
echo   PROCESO FINALIZADO
echo ========================================
pause
