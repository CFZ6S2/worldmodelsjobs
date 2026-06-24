const { execSync } = require('child_process');
const path = require('path');

const localQueue = path.join(__dirname, 'models_queue.json');
console.log("Uploading queue...");
execSync(`scp "${localQueue}" root@178.156.186.149:/root/worldmodels-jobs/telegram_sniffer/models_queue.json`, { stdio: 'inherit' });
console.log("Uploaded! Running invite script...");
execSync('ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node populate_and_invite.js"', { stdio: 'inherit' });
console.log("Done!");
