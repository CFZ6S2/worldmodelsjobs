@echo off
title GIT PUSH - WORLDMODELS
echo 📤 Subiendo cambios a GitHub...
echo -------------------------------
cd /d "c:\Users\cesar\Documents\trae_projects\worldmodels"
git add .
git commit -m "Auto-update: Stabilization and Duplication Fixes"
git push origin main
echo -------------------------------
echo ✅ Cambios subidos correctamente.
pause
