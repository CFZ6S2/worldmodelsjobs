@echo off
echo --- INICIANDO BUILD DE FRONTEND ---
cd web
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] El build ha fallado.
    exit /b %ERRORLEVEL%
)
echo --- BUILD COMPLETADO ---
cd ..
echo --- INICIANDO DESPLIEGUE A FIREBASE ---
call firebase deploy --project worldmodels-jobs --only hosting,functions
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] El despliegue ha fallado.
    exit /b %ERRORLEVEL%
)
echo --- PROCESO COMPLETADO CON EXITO ---
