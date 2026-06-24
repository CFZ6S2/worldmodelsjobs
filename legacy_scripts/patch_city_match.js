const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let dynEngine = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let code = dynEngine.parameters.jsCode;

const oldMatch = `// 1. PRIORITY: Explicit City Match (from IA detection)
if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
}`;

const newMatch = `// 1. PRIORITY: Explicit City Match (from IA detection)
if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    // Try to match if cityDetected contains the key
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key)) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}`;

code = code.replace(oldMatch, newMatch);
dynEngine.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with better city matching!");
