const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let routingNode = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let code = routingNode.parameters.jsCode;

code = `console.log("🚀 DRE CALLED WITH LEAD:", JSON.stringify($json));\n` + code;
code = code.replace(/return uniqueTargets/g, `console.log("🚀 DRE ROUTED TO:", JSON.stringify(uniqueTargets));\nreturn uniqueTargets`);

routingNode.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with debug logs in DRE!");
