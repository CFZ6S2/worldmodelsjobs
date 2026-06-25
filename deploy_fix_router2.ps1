scp scratch/final_v5_patched_fixed2.json root@178.156.186.149:/tmp/final_v5_patched_fixed2.json
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "docker cp /tmp/final_v5_patched_fixed2.json n8n:/tmp/final_v5_patched_fixed2.json && docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed2.json && docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true && docker restart n8n"
    Start-Sleep -Seconds 15
    ssh root@178.156.186.149 "node /tmp/send_mock_ru_unique.js"
} else {
    Write-Host "SCP failed"
}
