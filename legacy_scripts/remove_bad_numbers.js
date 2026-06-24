const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, 'n8n', 'active', 'worldmodels_fixed_v5.json'),
  path.join(__dirname, 'n8n', 'active', 'workflow_active.json'),
  path.join(__dirname, 'n8n', 'active', 'vps_buggy_safe.json')
];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.log(`Skipping file with invalid JSON: ${path.basename(file)}`);
    continue;
  }
  
  let modified = false;
  
  const workflows = Array.isArray(data) ? data : (data.nodes ? [data] : []);
  
  for (const wf of workflows) {
    if (!wf.nodes) continue;
    
    for (const node of wf.nodes) {
      if (node.name.startsWith('Dynamic Routing Engine') && node.parameters && node.parameters.jsCode) {
        let code = node.parameters.jsCode;
        
        const originalCode = code;
        
        // Remove the targets for Ibiza using a regex to catch both exact matches and variations
        // It's safer to just replace the whole Ibiza block with an empty targets array
        code = code.replace(
          /"ibiza":\s*\{\s*keywords:\s*\[[^\]]+\],\s*targets:\s*\[[\s\S]*?\]\s*\}/,
          `"ibiza": {
    keywords: ["ibiza", "eivissa", "mansour", "pacha", "lio", "ushuaia", "sant antoni"],
    targets: []
  }`
        );

        if (code !== originalCode) {
          node.parameters.jsCode = code;
          modified = true;
          console.log(`Removed Ibiza target numbers from ${path.basename(file)}`);
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Saved changes to ${file}`);
  }
}
