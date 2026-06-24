const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let parseJson = wf.nodes.find(n => n.name === 'Parse JSON1');
let code = parseJson.parameters.jsCode;

const oldMatch = `const lowerRaw = (input.texto_limpio || metadataWA.texto_limpio || metadataTG.texto_limpio || "").toLowerCase();`;
const newMatch = `const lowerRaw = (input.texto_limpio || metadataWA.texto_limpio || metadataTG.texto_limpio || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");`;

code = code.replace(oldMatch, newMatch);
parseJson.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with Parse JSON1 normalization!");
