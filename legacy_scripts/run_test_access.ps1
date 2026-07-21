scp .\test_access.js root@178.156.186.149:/root/worldmodels-jobs/test_access.js
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node test_access.js"
} else {
    Write-Host "SCP failed"
}
