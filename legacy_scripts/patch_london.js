const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'scratch', 'patched_wf_final.json');
const wf = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    let code = node.parameters.jsCode;
    
    // Replace the london target
    code = code.replace(
      /"london": {\s*keywords: \["london", "londres", "mayfair", "soho", "chelsea"\],\s*targets: \[\s*\{ to: "120363425790792660@g\.us", label: "LONDON" \}\s*\]\s*}/,
      `"london": {\n    keywords: ["london", "londres", "mayfair", "soho", "chelsea"],\n    targets: [\n      { to: "447444127962@s.whatsapp.net", label: "LONDON" }\n    ]\n  }`
    );
    
    node.parameters.jsCode = code;
    console.log('Patched Dynamic Routing Engine for London target');
  }
}

fs.writeFileSync(inputFile, JSON.stringify(wf, null, 2), 'utf-8');
