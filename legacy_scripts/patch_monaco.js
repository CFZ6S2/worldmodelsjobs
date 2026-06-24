const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let dynEngine = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let code = dynEngine.parameters.jsCode;

const oldMonaco = `"monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo", "cannes", "niza", "nice", "cote d'azur"],
    targets: [
    ]
  }`;

const newMonaco = `"monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo", "cannes", "niza", "nice", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  }`;

code = code.replace(oldMonaco, newMonaco);
dynEngine.parameters.jsCode = code;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with Monaco WhatsApp fix!");
