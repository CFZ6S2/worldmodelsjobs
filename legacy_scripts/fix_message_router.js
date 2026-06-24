const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('./scratch/final_v5_patched_fixed.json', 'utf8'));

for (const node of wf.nodes) {
  if (node.name === 'Message Router' && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    // Fix the literal '\n' syntax error
    code = code.replace(/\\nconst results = \[\];/g, '\nconst results = [];');
    node.parameters.jsCode = code;
  }
}

fs.writeFileSync('./scratch/final_v5_patched_fixed.json', JSON.stringify(wf, null, 2));
console.log('Fixed Message Router syntax in final_v5_patched_fixed.json');
