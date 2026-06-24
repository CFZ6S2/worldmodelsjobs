const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed6.json', 'utf8'));

// 1. PATCH MESSAGE ROUTER
let msgRouter = wf.nodes.find(n => n.name === 'Message Router');
const msgRouterCode = `const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138', wa: '120363425790792660@g.us', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'EN', tg: '-1003757267210', wa: '120363408216646972@g.us', title: item.title_en || item.title_es || 'New Lead', text: item.text_en || item.text_es || item.texto_limpio, tag: 'Sender' },
  { code: 'RU', tg: '-1003920309636', wa: '120363408298375271@g.us', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },
  { code: 'RU_CHANNEL', tg: '-1003934906353', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },
  { code: 'PT', tg: '-1003727383883', wa: '120363426262586004@g.us', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' }
];

function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
const cityRaw = normalize(String(item.city || 'Global').toLowerCase());
const textRaw = normalize(String(item.text_es || '').toLowerCase());

// MONACO
const monacoRegex = /(monaco|cannes|niza|monte carlo|cote d'azur)/i;
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw)) {
  langs.push({ code: 'PT_CLIENT_MONACO', tg: '8799609531', wa: '33672474796@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  langs.push({ code: 'PT_GROUP_MONACO', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}

// MADRID
const madridRegex = /(madrid|barajas|serrano|pozuelo)/i;
if ((madridRegex.test(cityRaw) || madridRegex.test(textRaw)) && item.category === 'evento') {
  // Client PT
  langs.push({ code: 'PT_CLIENT_MADRID', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Client ES
  langs.push({ code: 'ES_CLIENT_MADRID', tg: '6756692518', wa: '34615787912@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
  // Group PT
  langs.push({ code: 'PT_GROUP_MADRID', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}

// IBIZA
const ibizaRegex = /(ibiza|eivissa)/i;
if (ibizaRegex.test(cityRaw) || ibizaRegex.test(textRaw)) {
  langs.push({ code: 'ES_CLIENT_IBIZA', tg: '6062809265', wa: '34601169815@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
}

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
  const tgText = \`<b>\${escapeHTML(l.title)}</b>\\n🏷️ <b>\${categoryStr}</b>\\n📍 <b>\${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>\${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n\${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>\${l.tag}:</b> \${tgContact}\\n🔌 <b>Fuente:</b> \${escapeHTML(item.platform || 'WhatsApp')}\`;
  
  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText, wa_chat: l.wa }
  });
}
return results;`;

msgRouter.parameters.jsCode = msgRouterCode;


// 2. PATCH DYNAMIC ROUTING ENGINE
let dre = wf.nodes.find(n => n.name === 'Dynamic Routing Engine');
const dreCode = `console.log("🚀 DRE CALLED WITH LEAD:", JSON.stringify($json));
function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase());
const text = normalize(String(leadData.texto_limpio || leadData.text_es || '').toLowerCase());

const routingTable = {
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "5511953600828@s.whatsapp.net", label: "MADRID (PT)", categoryFilter: "evento" },
      { to: "34615787912@s.whatsapp.net", label: "MADRID (ES)", categoryFilter: "evento" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "monte carlo", "cannes", "niza", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" }
    ]
  }
};

let matchedTargets = [];

if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key)) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => text.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

if (uniqueTargets.length === 0) return [];

console.log("🚀 DRE ROUTED TO:", JSON.stringify(uniqueTargets));
return uniqueTargets.map(t => ({
  json: { 
    ...leadData, 
    target_wa: t.to, 
    city_label: t.label 
  }
}));`;

dre.parameters.jsCode = dreCode;

fs.writeFileSync('scratch/final_v5_patched_fixed7.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed7.json written!");
