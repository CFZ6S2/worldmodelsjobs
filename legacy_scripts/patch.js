const fs = require('fs');
const file = '/root/worldmodels-jobs/telegram_sniffer/sniffer.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("await input.text('Code: ')", "'61343'");
fs.writeFileSync(file, content);
console.log('Patched code');
