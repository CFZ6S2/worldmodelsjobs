const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/root/wf_A0QpoDzX559wzRXQ.json', 'utf8'));
const wf = data[0];
console.log(wf.nodes.map(n => n.name).join('\n'));
