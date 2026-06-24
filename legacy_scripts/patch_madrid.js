const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'scratch', 'patched_wf_final.json');
const wf = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    let code = node.parameters.jsCode;
    
    // Replace the madrid targets array to include the new number
    // We will do a simple string replacement for the madrid targets block
    const oldMadridTargets = `targets: [
      { to: "34664266926@s.whatsapp.net", label: "MADRID" },
      { to: "34603346859@s.whatsapp.net", label: "MADRID" }
    ]`;
    
    const newMadridTargets = `targets: [
      { to: "34664266926@s.whatsapp.net", label: "MADRID" },
      { to: "34603346859@s.whatsapp.net", label: "MADRID" },
      { to: "34647066645@s.whatsapp.net", label: "MADRID" }
    ]`;
    
    if (code.includes('34647066645')) {
      console.log('Madrid target already added.');
      process.exit(0);
    }
    
    // Fallback if the exact spacing doesn't match: regex replace
    code = code.replace(
      /targets:\s*\[\s*\{\s*to:\s*"34664266926@s\.whatsapp\.net",\s*label:\s*"MADRID"\s*},\s*\{\s*to:\s*"34603346859@s\.whatsapp\.net",\s*label:\s*"MADRID"\s*\}\s*\]/,
      newMadridTargets
    );
    
    node.parameters.jsCode = code;
    console.log('Patched Dynamic Routing Engine for Madrid target');
  }
}

fs.writeFileSync(inputFile, JSON.stringify(wf, null, 2), 'utf-8');
