const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/root/wf_patched_clean.json', 'utf8'));
const wf = data[0];

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine')) {
    node.parameters.jsCode = `// DYNAMIC ROUTING ENGINE v7.1 (FIXED INPUT)
let leadData = $input.first().json;
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = String(leadData.city || 'global').toLowerCase();
const text = String(leadData.text_es || '').toLowerCase();

// NORMALIZAMOS EL TEXTO PARA EVITAR PROBLEMAS CON TILDES
function normalize(str) {
  return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
}
const textNorm = normalize(text);
const cityNorm = normalize(cityDetected);

const routingTable = {
  "costa_azul": {
    keywords: ["monaco", "cannes", "niza", "nice", "monte carlo", "cote d'azur"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  }
};

let matchedTargets = [];

// 1. SECONDARY: Keyword Match (Busca en ciudad y texto)
for (const [key, config] of Object.entries(routingTable)) {
    if (config.keywords.some(kw => textNorm.includes(kw) || cityNorm.includes(kw))) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}

// 2. FALLBACK: Global feed (WORLDWIDE - Cualquier ciudad que no coincida con cliente)
if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}

// Ensure unique targets
const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

if (uniqueTargets.length === 0) return [];

return uniqueTargets.map(t => ({
  json: { 
    ...leadData, 
    target_wa: t.to, 
    city_label: t.label 
  }
}));`;
    console.log('Fixed Dynamic Routing Engine');
  }
}

fs.writeFileSync('/root/wf_patched_clean2.json', JSON.stringify(data, null, 2));
console.log('Successfully saved to /root/wf_patched_clean2.json');
