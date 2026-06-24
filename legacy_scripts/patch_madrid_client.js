const fs = require('fs');
const wfPath = './scratch/final_v5_patched_fixed2.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Message Router
let msgRouter = wf.nodes.find(n => n.name === 'Message Router');
let msgCode = msgRouter.parameters.jsCode;

// Remove client 1 from Monaco
msgCode = msgCode.replace(
  "  // Envía a la clienta (Telegram)\n  langs.push({ code: 'PT_CLIENT', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n",
  ""
);

// Add Madrid logic
const madridLogic = `
const madridRegex = /(madrid|barajas|serrano|pozuelo)/i;
if ((madridRegex.test(cityRaw) || madridRegex.test(textRaw)) && item.category === 'evento') {
  langs.push({ code: 'PT_CLIENT_MADRID', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
`;
if (!msgCode.includes("PT_CLIENT_MADRID")) {
  msgCode = msgCode.replace("// -----------------------------------", madridLogic + "\n// -----------------------------------");
}
msgRouter.parameters.jsCode = msgCode;

// 2. Dynamic Routing Engine
let dynRouter = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let dynCode = dynRouter.parameters.jsCode;

// Remove from Monaco
dynCode = dynCode.replace(
  '      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" },\n',
  ""
);

// Add to Madrid
dynCode = dynCode.replace(
  '    keywords: ["madrid", "barajas", "serrano", "pozuelo"],\n    targets: []\n  },',
  '    keywords: ["madrid", "barajas", "serrano", "pozuelo"],\n    targets: [\n      { to: "5511953600828@s.whatsapp.net", label: "MADRID (PT)", categoryFilter: "evento" }\n    ]\n  },'
);

// Add category filter logic to Dynamic Routing Engine
if (!dynCode.includes('categoryFilter')) {
  dynCode = dynCode.replace(
    '// Ensure unique targets',
    `let filteredTargets = [];
for (let t of matchedTargets) {
    if (!t.categoryFilter || t.categoryFilter === category) {
        filteredTargets.push(t);
    }
}
matchedTargets = filteredTargets;

// Ensure unique targets`
  );
}
dynRouter.parameters.jsCode = dynCode;


// 3. Dynamic WhatsApp Alert
let alertNode = wf.nodes.find(n => n.name === 'Dynamic WhatsApp Alert');
let alertCode = alertNode.parameters.jsonBody;

alertCode = alertCode.replace(
  "if (label === 'COSTA AZUL' || target === '5511953600828@s.whatsapp.net') {",
  "if (label === 'COSTA AZUL' || label === 'MADRID (PT)') {"
);
alertNode.parameters.jsonBody = alertCode;

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log("JSON successfully updated.");
