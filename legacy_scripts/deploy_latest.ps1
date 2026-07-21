scp .\scratch\patched_latest.json root@178.156.186.149:/tmp/patched_latest.json
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "docker cp /tmp/patched_latest.json n8n:/tmp/patched_latest.json && docker exec n8n n8n import:workflow --input=/tmp/patched_latest.json && docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true && docker exec n8n n8n update:workflow --id=worldmodels-v5-fixed-global --active=false && docker restart n8n"
} else {
    Write-Host "SCP failed"
}
