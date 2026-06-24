const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let parseJson = wf.nodes.find(n => n.name === 'Parse JSON1');
let code = parseJson.parameters.jsCode;

const oldReturn = `const finalData = {
  platform,
  contact,`;

const newReturn = `const finalData = {
  platform,
  contact,
  texto_limpio: input.texto_limpio || metadataWA.texto_limpio || metadataTG.texto_limpio || "",`;

code = code.replace(oldReturn, newReturn);
parseJson.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with texto_limpio in Parse JSON1!");
