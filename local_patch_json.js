const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/root/wf_A0QpoDzX559wzRXQ.json', 'utf8'));
const wf = data[0];

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    if (!code.includes('5511953600828@s.whatsapp.net')) {
      const monacoBlock = `,\n  "costa_azul": {\n    keywords: ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"],\n    targets: [\n      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" }\n    ]\n  }`;
      code = code.replace(/(\}\s*\n\s*\};)/, `}${monacoBlock}\n};`);
      node.parameters.jsCode = code;
      console.log('Patched Dynamic Routing Engine');
    }
  }
  
  if (node.name.startsWith('Message Router') && node.parameters && node.parameters.jsCode) {
    let code = node.parameters.jsCode;
    if (!code.includes('5479166354')) {
      const tgInject = `
// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
const cityRaw = String(item.city || 'Global').toLowerCase();
const textRaw = String(item.text_es || '').toLowerCase();
const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
// -----------------------------------
`;
      code = code.replace('const results = [];', tgInject + '\nconst results = [];');
      node.parameters.jsCode = code;
      console.log('Patched Message Router');
    }
  }
  
  if (node.name.startsWith('Dynamic WhatsApp Alert') && node.parameters && node.parameters.jsonBody) {
    let body = node.parameters.jsonBody;
    if (!body.includes('ALERTA COSTA AZUL') && !body.includes('isCostaAzul')) {
      node.parameters.jsonBody = `={{ (() => {
  const target = $json.target_wa || '';
  const label = ($json.city_label || '').toUpperCase();
  
  if (label === 'DUBAI' || target === '905344119396@s.whatsapp.net') {
    return { "to": target, "body": "*📢 ALERT DUBAI*\\n📍 *" + ($json.city || "Dubai") + "* | 💰 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_en || $json.text_es || "No description") + "\\n\\n👤 *Contact:* " + ($json.contact || "Unknown") + "\\n🔌 *Source:* " + ($json.platform || "WhatsApp") };
  } 
  else if (label === 'COSTA AZUL' || target === '5511953600828@s.whatsapp.net') {
    return { "to": target, "body": "*📢 ALERTA COSTA AZUL*\\n📍 *" + ($json.city || "Desconhecida") + "* | 💰 *" + ($json.budget || "Negociável") + "*\\n\\n" + ($json.text_pt || $json.text_es || "Sem descrição") + "\\n\\n👤 *Remetente:* " + ($json.contact || "Desconhecido") + "\\n🔌 *Fonte:* " + ($json.platform || "WhatsApp") };
  }
  else {
    return { "to": target, "body": "*📢 ALERTA " + (label || "GLOBAL") + "*\\n📍 *" + ($json.city || "Desconocida") + "* | 💰 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripción") + "\\n\\n👤 *Remitente:* " + ($json.contact || "Desconocido") + "\\n🔌 *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}`;
      console.log('Patched Dynamic WhatsApp Alert');
    }
  }
}

fs.writeFileSync('/root/wf_patched.json', JSON.stringify(data, null, 2));
console.log('Successfully saved to /root/wf_patched.json');
