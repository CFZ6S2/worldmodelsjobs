scp .\fetch_leads.js root@178.156.186.149:/root/worldmodels-jobs/fetch_leads.js
if ($LASTEXITCODE -eq 0) {
    ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node fetch_leads.js"
} else {
    Write-Host "SCP failed"
}
