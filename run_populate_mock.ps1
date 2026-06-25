scp .\populate_and_invite_mock.js root@178.156.186.149:/root/worldmodels-jobs/populate_and_invite_mock.js
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node populate_and_invite_mock.js"
} else {
    Write-Host "SCP failed"
}
