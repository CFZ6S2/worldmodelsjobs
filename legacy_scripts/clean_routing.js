const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/root/wf_patched.json', 'utf8'));
const wf = data[0];

for (const node of wf.nodes) {
  if (node.name.startsWith('Dynamic Routing Engine')) {
    node.parameters.jsCode = `// DYNAMIC ROUTING ENGINE v7.0 (CLEAN CLIENTS ONLY)
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
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
    console.log('Cleaned Dynamic Routing Engine');
  }
  
  if (node.name.startsWith('Message Router')) {
    node.parameters.jsCode = `const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' }
];

// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
const cityRaw = normalize(String(item.city || 'Global').toLowerCase());
const textRaw = normalize(String(item.text_es || '').toLowerCase());
const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "cote d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
// -----------------------------------

const results = [];
for (const l of langs) {
  function formatOutputContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? \`<a href="tg://user?id=\${id}">Chat Directo</a>\` : \`ID: \${id}\`;
    }
    if (/[a-zA-Z]/.test(val) && !/\\d/.test(val)) {
       const user = String(val).replace('@', '');
       return mode === 'html' ? \`<a href="https://t.me/\${user}">@\${user}</a>\` : \`@\${user}\`;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? \`+\${s}\` : val;
  }

  const tgContact = formatOutputContact(item.contact || item.final_contact, 'html');

  const categoryStr = (item.category === 'plaza') ? 'Plazas' : 'Eventos';

  // Si es la clienta en Portugues, ajustar los encabezados
  let tgText = '';
  if (l.code === 'PT_CLIENT') {
    tgText = \`<b>\${escapeHTML(l.title)}</b>\\n🏷️ <b>\${categoryStr}</b>\\n📍 <b>\${escapeHTML(item.city || 'Desconhecida')}</b>\\n💰 <b>\${escapeHTML(item.budget || 'Negociável')}</b>\\n\\n\${escapeHTML(l.text || 'Sem texto')}\\n\\n👤 <b>\${l.tag}:</b> \${tgContact}\\n🔌 <b>Fonte:</b> \${escapeHTML(item.platform || 'WhatsApp')}\`;
  } else {
    tgText = \`<b>\${escapeHTML(l.title)}</b>\\n🏷️ <b>\${categoryStr}</b>\\n📍 <b>\${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>\${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n\${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>\${l.tag}:</b> \${tgContact}\\n🔌 <b>Fuente:</b> \${escapeHTML(item.platform || 'WhatsApp')}\`;
  }
  
  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText }
  });
}
return results;`;
    console.log('Cleaned Message Router');
  }
}

fs.writeFileSync('/root/wf_patched_clean.json', JSON.stringify(data, null, 2));
console.log('Successfully saved to /root/wf_patched_clean.json');
