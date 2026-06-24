const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'scratch', 'patched_wf_final.json');
const wf = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    let code = node.parameters.jsCode;
    
    // Change fallback logic to ALWAYS add the global group, not just when length === 0
    code = code.replace(
      /if \(matchedTargets\.length === 0 && \(category === 'evento' \|\| category === 'plaza'\)\) \{/g,
      "// ALWAYS send to Global feed (so the user sees everything in the main group)\nif (category === 'evento' || category === 'plaza') {"
    );
    
    node.parameters.jsCode = code;
    console.log('Patched Dynamic Routing Engine to always send to Global group');
  }
}

fs.writeFileSync(inputFile, JSON.stringify(wf, null, 2), 'utf-8');
