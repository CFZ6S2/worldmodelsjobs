const { execSync } = require('child_process');
const path = require('path');

const localPath = path.join(__dirname, 'scratch', 'final_v5_patched_fixed3.json');
console.log("Copying from", localPath);
execSync(`scp "${localPath}" root@178.156.186.149:/tmp/final_v5_patched_fixed3.json`, { stdio: 'inherit' });
execSync('ssh root@178.156.186.149 "docker exec n8n n8n import:workflow --input=/tmp/final_v5_patched_fixed3.json; docker exec n8n n8n update:workflow --id=A0QpoDzX559wzRXQ --active=true; docker restart n8n"', { stdio: 'inherit' });
console.log("Deployed and restarted n8n!");
