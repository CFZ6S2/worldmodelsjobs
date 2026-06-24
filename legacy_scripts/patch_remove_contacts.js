const fs = require('fs');
const wfPath = './scratch/final_v5_patched_fixed2.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Remove Telegram ID 8653719069 from Message Router
let msgRouter = wf.nodes.find(n => n.name === 'Message Router');
let msgCode = msgRouter.parameters.jsCode;
msgCode = msgCode.replace(
  /  \/\/ Cliente 3 \(Nuevo Telegram\)\n  langs\.push\(\{ code: 'PT_CLIENT_3', tg: '8653719069', title: item\.title_pt \|\| item\.title_es \|\| 'Novo Lead', text: item\.text_pt \|\| item\.text_es \|\| item\.texto_limpio, tag: 'Remetente' \}\);\n/,
  ""
);
msgRouter.parameters.jsCode = msgCode;

// 2. Remove WhatsApp 447471373828@s.whatsapp.net from Dynamic Routing Engine
let dynRouter = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
let dynCode = dynRouter.parameters.jsCode;

dynCode = dynCode.replace(
  /      \{ to: "447471373828@s\.whatsapp\.net", label: "COSTA AZUL" \}\n/,
  ""
);
// Now targets array for monaco will be empty or malformed if it has no trailing elements, let's fix that.
// The array was: targets: [ \n      { to: "447471373828@s.whatsapp.net", label: "COSTA AZUL" } \n    ]
// Removing the line leaves: targets: [ \n    ]
// That's perfectly valid JavaScript!

dynRouter.parameters.jsCode = dynCode;

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log("JSON successfully updated to remove the requested contacts.");
