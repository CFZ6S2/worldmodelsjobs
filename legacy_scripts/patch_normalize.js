const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let dynEngine = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let code = dynEngine.parameters.jsCode;

const oldStart = `// DYNAMIC ROUTING ENGINE v6.0 (WORLDWIDE COMPATIBLE)
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = String(leadData.city || 'global').toLowerCase();
const text = String(leadData.text_es || '').toLowerCase();`;

const newStart = `// DYNAMIC ROUTING ENGINE v6.0 (WORLDWIDE COMPATIBLE)
function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase());
const text = normalize(String(leadData.text_es || '').toLowerCase());`;

code = code.replace(oldStart, newStart);
dynEngine.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with normalization fix!");
