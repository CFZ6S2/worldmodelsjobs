const fs = require('fs');
const path = 'worldmodels_n8n_v4_final.json';
const workflow = JSON.parse(fs.readFileSync(path, 'utf8'));

const preFilter = workflow.nodes.find(n => n.name === 'Pre-Filter Unified1');
let code = preFilter.parameters.jsCode;

// Quitar +57 y Dolores de los bloqueos
code = code.replace('"57", ', '');
code = code.replace(', "Dolores"', '');
code = code.replace(', "dolores"', '');

preFilter.parameters.jsCode = code;
fs.writeFileSync(path, JSON.stringify(workflow, null, 2));
