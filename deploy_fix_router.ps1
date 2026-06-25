node scratch/fix_message_router.js
scp scratch/final_v5_patched_fixed.json root@178.156.186.149:/tmp/final_v5_patched_fixed.json
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "docker cp /tmp/final_v5_patched_fixed.json n8n:/tmp/final_v5_patched_fixed.json && docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed.json && docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true && docker restart n8n"
    # Luego de reiniciar N8N, esperamos 15 segundos y lanzamos el mock otra vez.
    Start-Sleep -Seconds 15
    ssh root@178.156.186.149 "node /tmp/send_mock_ru_real.js"
} else {
    Write-Host "SCP failed"
}
