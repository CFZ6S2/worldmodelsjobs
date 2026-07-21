$ErrorActionPreference = "Stop"
$jsonFile = "C:\Users\cesar\Documents\trae_projects\worldmodels\scratch\final_v5_patched_fixed6.json"
Write-Host "Copiando archivo JSON al VPS por SSH..."
scp $jsonFile root@178.156.186.149:/tmp/final_v5_patched_fixed6.json

Write-Host "Ejecutando importacion, activacion y reinicio en el VPS..."
ssh root@178.156.186.149 "docker cp /tmp/final_v5_patched_fixed6.json n8n:/tmp/final_v5_patched_fixed6.json && docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed6.json && docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true && docker restart n8n"

Write-Host "Completado con exito!"
