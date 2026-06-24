const { execSync } = require('child_process');
const fs = require('fs');

fs.writeFileSync('test_lead777.json', JSON.stringify({
  "message": {
    "chat": {
      "id": 12345
    },
    "text": "Busco modelo en monaco hoy pago altisimo @testuser777"
  }
}));

execSync('scp test_lead777.json root@178.156.186.149:/tmp/test_lead777.json', { stdio: 'inherit' });
execSync('ssh root@178.156.186.149 "curl -X POST -H \'Content-Type: application/json\' -d @/tmp/test_lead777.json http://localhost:5678/webhook/telegram-wm-2024"', { stdio: 'inherit' });
