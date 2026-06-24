const fs = require('fs');
const content = fs.readFileSync('./scratch/vps_all_workflows_backup.json', 'utf16le');
const data = JSON.parse(content.trim());
console.log('Workflows found: ' + data.length);
for (const wf of data) {
    console.log(`ID: ${wf.id} | Name: "${wf.name}" | Active: ${wf.active} | Updated: ${wf.updatedAt}`);
}
