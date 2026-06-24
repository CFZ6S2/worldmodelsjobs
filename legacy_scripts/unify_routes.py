import json
import subprocess

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

DRE_CODE = '''const leadData = $json;

const routingTable = {
  "russia_turkey": {
    keywords: ["rusia", "russia", "\\\\bru\\\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: []
  },
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "353830078788@s.whatsapp.net", label: "MADRID" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" },
      { to: "34670652138@s.whatsapp.net", label: "IBIZA" }
    ]
  },
  "marbella": {
    keywords: ["marbella", "puerto banus", "costa del sol", "malaga", "málaga", "estepona"],
    targets: [
      { to: "34670652138@s.whatsapp.net", label: "MARBELLA" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "cannes", "\\\\bniza\\\\b", "monte carlo", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  },
  "amsterdam": {
    keywords: ["amsterdam", "holanda", "paises bajos", "netherlands", "nederland", "rotterdam", "la haya", "schiphol", "utrecht"],
    targets: [
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM" }
    ]
  }
};

const globalTargets = [
  { to: "120363425790792660@g.us", label: "GLOBAL" },
  { to: "120363408216646972@g.us", label: "GLOBAL" },
  { to: "120363408298375271@g.us", label: "GLOBAL" },
  { to: "120363426262586004@g.us", label: "GLOBAL" }
];

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
}

const cityDetected = normalize(String(leadData.city || 'global').toLowerCase().trim());
const text = normalize(String(leadData.text_es || leadData.texto_limpio || leadData.text_en || leadData.text_pt || leadData.text || '').toLowerCase());

let matchedTargets = [];

if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key) || config.keywords.some(kw => cityDetected.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => {
            if (kw.includes('\\\\b')) return new RegExp(kw, 'i').test(text);
            return text.includes(kw);
        })) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

matchedTargets = [...matchedTargets, ...globalTargets];

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

return uniqueTargets.map(t => {
    const result = { ...leadData };
    result.target_wa = t.to;
    result.city_label = t.label;
    return { json: result };
});
'''

MR_CODE = '''const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' },
  { code: 'EN', tg: '-1003757267210', title: item.title_en || item.title_es || 'New Lead', text: item.text_en || item.text_es || item.texto_limpio, tag: 'Sender' },
  { code: 'RU', tg: '-1003920309636', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },
  { code: 'RU_CHANNEL', tg: '-1003934906353', title: item.title_ru || item.title_es || 'Новый Лид', text: item.text_ru || item.text_es || item.texto_limpio, tag: 'Отправитель' },
  { code: 'PT', tg: '-1003727383883', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' }
];

function normalize(str) { return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }
const cityRaw = normalize(String(item.city || 'Global').toLowerCase());
const textRaw = normalize(String(item.text_es || '').toLowerCase());

// MONACO (TG ONLY)
const monacoRegex = /(monaco|cannes|\\bniza\\b|monte carlo|cote d'azur)/i;
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw)) {
  langs.push({ code: 'PT_CLIENT_MONACO', tg: '8799609531', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  langs.push({ code: 'PT_GROUP_MONACO', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}

// MADRID (TG ONLY)
const madridRegex = /(madrid|barajas|serrano|pozuelo)/i;
if ((madridRegex.test(cityRaw) || madridRegex.test(textRaw)) ) {
  langs.push({ code: 'ES_CLIENT_MADRID_PAULA', tg: '7667292228', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
  langs.push({ code: 'PT_GROUP_MADRID', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}

// AMSTERDAM (TG ONLY)
const amsterdamRegex = /(amsterdam|holanda|paises bajos|netherlands|nederland|rotterdam|la haya|schiphol|utrecht)/i;
if (amsterdamRegex.test(cityRaw) || amsterdamRegex.test(textRaw)) {
  langs.push({ code: 'ES_CLIENT_AMSTERDAM', tg: '6630067001', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
}

// LONDON (TG ONLY)
const londonRegex = /(london|londres|mayfair|soho|chelsea)/i;
if ((londonRegex.test(cityRaw) || londonRegex.test(textRaw)) ) {
  langs.push({ code: 'EN_CLIENT_LONDON', tg: '8688528643', title: item.title_en || item.title_es || 'New Lead', text: item.text_en || item.text_es || item.texto_limpio, tag: 'Sender' });
}

// RUSSIA_TURKEY (TG ONLY)
const russiaTurkeyRegex = /(rusia|russia|россия|mosc[uú]|moscow|москва|san petersburgo|saint petersburg|st petersburg|санкт-петербург|питер|kaz[aá]n|казань|sochi|сочи|vladivostok|владивосток|novosibirsk|новосибирск|ekaterimburgo|yekaterinburg|екатеринбург|bak[uú]|баку|tiflis|tbilisi|тбилиси|kiev|kyiv|киев|київ|киів|turqu[ií]a|turkey|türkiye|турция|estambul|istanbul|стамбул|ankara|анкара|antalya|анталья|анталия|izmir|esmirna|измир|bodrum|бодрум|bursa|бурса|capadocia|cappadocia|каппадокия)/i;
if (russiaTurkeyRegex.test(cityRaw) || russiaTurkeyRegex.test(textRaw)) {
  langs.push({ 
      code: 'RU_CLIENT_RT', 
      tg: '1800004016', 
      title: item.title_ru || item.title_es || 'Новый Лид', 
      text: item.text_ru || item.text_es || item.texto_limpio, 
      tag: 'Отправитель' 
    });
}

const results = [];
for (const l of langs) {
  function formatOutputContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? `<a href="tg://user?id=${id}">Chat Directo</a>` : `ID: ${id}`;
    }
    if (/[a-zA-Z]/.test(val) && !/\d/.test(val)) {
       const user = String(val).replace('@', '');
       return mode === 'html' ? `<a href="https://t.me/${user}">@${user}</a>` : `@${user}`;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? `+${s}` : val;
  }

  const tgContact = formatOutputContact(item.contact || item.final_contact, 'html');
  const categoryStr = (item.category === 'plaza') ? 'Plazas' : 'Eventos';
  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>Fuente:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;
  
  if (l.tg) {
      results.push({
        json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText }
      });
  }
}
return results;
'''

for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic Routing Engine':
        n['parameters']['jsCode'] = DRE_CODE
    if n['name'] == 'Message Router':
        n['parameters']['jsCode'] = MR_CODE

# Disconnect Message Router from WhatsApp Alert
conns = wf.get('connections', {})
if 'Message Router' in conns:
    main_conns = conns['Message Router'].get('main', [[]])
    if len(main_conns) > 0:
        main_conns[0] = [t for t in main_conns[0] if t['node'] != 'Dynamic WhatsApp Alert']

with open('/tmp/wf_patch6_out.json', 'w') as f:
    json.dump(wf, f)

subprocess.run(["docker", "cp", "/tmp/wf_patch6_out.json", "n8n:/tmp/wf_patch6_out.json"], check=True)
subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch6_out.json"], check=True)
print("Applied clean unification of WhatsApp routes to DRE and Telegram routes to MR")
