scp .\populate_only.js root@178.156.186.149:/root/worldmodels-jobs/populate_only.js
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node populate_only.js"
} else {
    Write-Host "SCP failed"
}
