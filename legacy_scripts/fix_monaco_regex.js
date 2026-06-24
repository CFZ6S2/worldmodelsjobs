const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('./scratch/final_v5_patched.json', 'utf8'));

for (const node of wf.nodes) {
  if (node.name === 'Message Router' && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    // Fix regex: remove \b and fix cote d'azur
    code = code.replace(
      /const monacoRegex = \/\\b\(monaco\|cannes\|niza\|nice\|monte carlo\|côte d'azur\)\\b\/i;/,
      `const monacoRegex = /(monaco|cannes|niza|nice|monte carlo|cote d'azur)/i;`
    );
    node.parameters.jsCode = code;
  }
}

fs.writeFileSync('./scratch/final_v5_patched_fixed.json', JSON.stringify(wf, null, 2));
console.log('Saved final_v5_patched_fixed.json');
