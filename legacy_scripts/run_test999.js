const { execSync } = require('child_process');
execSync('scp test_lead999.json root@178.156.186.149:/tmp/test_lead999.json', { stdio: 'inherit' });
execSync('ssh root@178.156.186.149 "curl -X POST -H \'Content-Type: application/json\' -d @/tmp/test_lead999.json http://localhost:5678/webhook/telegram-wm-2024"', { stdio: 'inherit' });
