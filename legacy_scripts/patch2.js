const fs = require('fs');
const file = '/root/worldmodels-jobs/telegram_sniffer/sniffer.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("'61343'", "'69381'");
content = content.replace("await input.text('Code: ')", "'69381'"); // just in case it was restored
fs.writeFileSync(file, content);
console.log('Patched code with 69381');
