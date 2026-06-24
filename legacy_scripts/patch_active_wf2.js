const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

// 1. Fix connections
wf.connections["Quality Score"] = {
  "main": [
    [
      { "node": "Message Router", "type": "main", "index": 0 },
      { "node": "Post Backend", "type": "main", "index": 0 },
      { "node": "Dynamic Routing Engine", "type": "main", "index": 0 }
    ]
  ]
};

wf.connections["Message Router"] = {
  "main": [
    [
      { "node": "Telegram Fanout", "type": "main", "index": 0 }
    ]
  ]
};

wf.connections["Dynamic Routing Engine"] = {
  "main": [
    [
      { "node": "Global Alert Waiter", "type": "main", "index": 0 }
    ]
  ]
};

// 2. Fix Dynamic Routing Engine code
let dynRouter = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');

const newCode = `// DYNAMIC ROUTING ENGINE v6.1 (WORLDWIDE COMPATIBLE)
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = String(leadData.city || 'global').toLowerCase();
const text = String(leadData.text_es || '').toLowerCase();

const routingTable = {
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "MADRID (PT)", categoryFilter: "evento" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo", "cannes", "niza", "nice", "cote d'azur"],
    targets: []
  }
};

let matchedTargets = [];

// 1. PRIORITY: Explicit City Match (from IA detection)
if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
}

// 2. SECONDARY: Keyword Match
if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => text.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

// 3. FALLBACK: Global feed (WORLDWIDE - Any city that reaches here)
if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}

// FILTER BY CATEGORY
let filteredTargets = [];
for (let t of matchedTargets) {
    if (!t.categoryFilter || t.categoryFilter === category) {
        filteredTargets.push(t);
    }
}
matchedTargets = filteredTargets;

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

dynRouter.parameters.jsCode = newCode;

// 3. Fix Message Router to ensure Monaco Telegram IDs are also empty if requested (Wait, I removed Telegram ID 8653719069 previously).
let msgRouter = wf.nodes.find(n => n.name === 'Message Router');
let msgCode = msgRouter.parameters.jsCode;
msgCode = msgCode.replace(
  /  \/\/ Cliente 3 \(Nuevo Telegram\)\n  langs\.push\(\{ code: 'PT_CLIENT_3', tg: '8653719069', title: item\.title_pt \|\| item\.title_es \|\| 'Novo Lead', text: item\.text_pt \|\| item\.text_es \|\| item\.texto_limpio, tag: 'Remetente' \}\);\n/,
  ""
);
msgRouter.parameters.jsCode = msgCode;

fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json fixed successfully!");
