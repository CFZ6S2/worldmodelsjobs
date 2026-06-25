scp .\n8n\active\worldmodels_fixed_v5.json root@178.156.186.149:/tmp/patched_wf.json
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "docker cp /tmp/patched_wf.json n8n:/tmp/patched_wf.json && docker exec n8n n8n import:workflow --input=/tmp/patched_wf.json"
} else {
    Write-Host "SCP failed"
}
