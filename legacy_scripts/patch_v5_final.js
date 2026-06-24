const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('./n8n/active/worldmodels_fixed_v5.json', 'utf8'));

let modified = false;

for (const node of wf.nodes) {
  // 1. Dynamic Routing Engine: Remove Madrid targets, set Monaco targets
  if (node.name === 'Dynamic Routing Engine' && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    
    // Remove Madrid
    code = code.replace(
      /"madrid":\s*\{\s*keywords:\s*\[[^\]]+\],\s*targets:\s*\[[\s\S]*?\]\s*\}/,
      `"madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: []
  }`
    );

    // Update Monaco to point to Costa Azul clients
    code = code.replace(
      /"monaco":\s*\{\s*keywords:\s*\[[^\]]+\],\s*targets:\s*\[[\s\S]*?\]\s*\}/,
      `"monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo", "cannes", "niza", "nice", "cote d'azur"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" },
      { to: "447471373828@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  }`
    );

    node.parameters.jsCode = code;
    modified = true;
  }

  // 2. Message Router: Add the injected Costa Azul code for Telegram clients
  if (node.name === 'Message Router' && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    if (!code.includes('INJECTED: COSTA AZUL CLIENT')) {
      const injection = `
// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
const cityRaw = normalize(String(item.city || 'Global').toLowerCase());
const textRaw = normalize(String(item.text_es || '').toLowerCase());
const monacoRegex = /\\b(monaco|cannes|niza|nice|monte carlo|côte d'azur)\\b/i;
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw)) {
  // Envía a la clienta (Telegram)
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía a la clienta 2 (Telegram y WhatsApp)
  langs.push({ code: 'PT_CLIENT_2', tg: '8799609531', wa: '33672474796@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía al grupo de referencias
  // Cliente 3 (Nuevo Telegram)
  langs.push({ code: 'PT_CLIENT_3', tg: '8653719069', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
// -----------------------------------
`;
      code = code.replace('const results = [];', injection + '\\nconst results = [];');
      node.parameters.jsCode = code;
      modified = true;
    }
  }

  // 3. Dynamic WhatsApp Alert: Add Portuguese support for Costa Azul
  if (node.name === 'Dynamic WhatsApp Alert' && node.parameters && node.parameters.jsonBody) {
    node.parameters.jsonBody = `={{ (() => {
  const target = $json.target_wa || '';
  const label = ($json.city_label || '').toUpperCase();
  
  if (label === 'COSTA AZUL' || target === '5511953600828@s.whatsapp.net') {
    return { "to": target, "body": "*📢 ALERTA COSTA AZUL*\\n📍 *" + ($json.city || "Desconhecida") + "* | 💰 *" + ($json.budget || "Negociável") + "*\\n\\n" + ($json.text_pt || $json.text_es || "Sem descrição") + "\\n\\n👤 *Remetente:* " + ($json.contact || "Desconhecido") + "\\n🔌 *Fonte:* " + ($json.platform || "WhatsApp") };
  }
  else {
    return { "to": target, "body": "*📢 ALERTA " + (label || "GLOBAL") + "*\\n📍 *" + ($json.city || "Desconocida") + "* | 💰 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripción") + "\\n\\n👤 *Remitente:* " + ($json.contact || "Desconocido") + "\\n🔌 *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}`;
    modified = true;
  }
}

fs.writeFileSync('./scratch/final_v5_patched.json', JSON.stringify(wf, null, 2));
console.log('Saved final_v5_patched.json');
