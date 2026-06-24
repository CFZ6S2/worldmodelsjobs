const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed8.json', 'utf8'));

// 1. ADD CONTINUE ON FAIL TO TELEGRAM FANOUT
let tgFanout = wf.nodes.find(n => n.name === 'Telegram Fanout');
if (tgFanout) {
  tgFanout.continueOnFail = true;
}

// 2. PATCH MESSAGE ROUTER
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
  langs.push({ code: 'ES_CLIENT_MADRID', tg: '6756692518', wa: '34615787912@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Group PT
  langs.push({ code: 'PT_GROUP_MADRID', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}

// IBIZA
const ibizaRegex = /(ibiza|eivissa)/i;
if (ibizaRegex.test(cityRaw) || ibizaRegex.test(textRaw)) {
  // Client 1 (Removed TG per user request, will only send to WA)
  langs.push({ code: 'ES_CLIENT_IBIZA_1', tg: '', wa: '34601169815@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
  // Client 2
  langs.push({ code: 'ES_CLIENT_IBIZA_2', tg: '7667292228', wa: '353830078788@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
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
  
  // Si no hay TG, mandamos un JSON vacio para tg_chat asi falla silenciósamente en el Fanout
  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText, wa_chat: l.wa }
  });
}
return results;`;

msgRouter.parameters.jsCode = msgRouterCode;

fs.writeFileSync('scratch/final_v5_patched_fixed9.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed9.json written!");
