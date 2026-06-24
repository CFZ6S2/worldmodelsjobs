const { execSync } = require('child_process');
execSync('node patch_router.js', { stdio: 'inherit' });
execSync('scp scratch/final_v5_patched_fixed2.json root@178.156.186.149:/tmp/final_v5_patched_fixed2.json', { stdio: 'inherit' });
execSync('ssh root@178.156.186.149 "docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed2.json; docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true; docker restart n8n"', { stdio: 'inherit' });
console.log("Deployed and restarted n8n!");
