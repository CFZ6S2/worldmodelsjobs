const fs = require('fs');
const path = '/root/worldmodels-jobs/worldmodels_n8n_v4_final.json';
const workflow = JSON.parse(fs.readFileSync(path, 'utf8'));
const preFilter = workflow.nodes.find(n => n.name === 'Pre-Filter Unified1');
let code = preFilter.parameters.jsCode;

// Ban numbers
const numbers = ['447386465053', '34610162905', '34611293140'];
numbers.forEach(n => {
  if (!code.includes(n)) {
    code = code.replace('"5527999696247"', '"5527999696247", "' + n + '"');
  }
});

// Add Trash filter
const trashLogic = "  if (/[macho|pasame|michell|hija de puta|vaya mierda]/i.test(text)) { continue; }\n";
if (!code.includes('macho')) {
  code = code.replace(/const sender = [^;]+;/, (match) => match + '\n' + trashLogic);
}

preFilter.parameters.jsCode = code;
fs.writeFileSync(path, JSON.stringify(workflow, null, 2));
