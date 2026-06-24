const { execSync } = require('child_process');
const path = require('path');

const localScript = path.join(__dirname, 'invite_safe.js');
console.log("Uploading safe invite script...");
execSync(`scp "${localScript}" root@178.156.186.149:/root/worldmodels-jobs/invite_safe.js`, { stdio: 'inherit' });
console.log("Uploaded! Running safe invite script...");
execSync('ssh root@178.156.186.149 "cd /root/worldmodels-jobs && node invite_safe.js"', { stdio: 'inherit' });
console.log("Done!");
