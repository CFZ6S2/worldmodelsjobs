import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

dre_code = """
console.log("🚀 DRE CALLED WITH LEAD:", JSON.stringify($json));
function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

// Fallback to multiple ways of getting the data depending on N8N version
let leadData = $json || {};
if (!leadData.city && !leadData.text_es && !leadData.text) {
    try { leadData = $('Parse JSON1').item.json; } catch(e) {}
}

const category = String(leadData.category || 'evento').toLowerCase().trim();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase().trim());
const text = normalize(String(leadData.texto_limpio || leadData.text_es || leadData.text_en || leadData.text_pt || leadData.text || '').toLowerCase());

const routingTable = {
  "russia_turkey": {
    keywords: ["rusia", "russia", "\\bru\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: [
      { to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", tg_chat: "1800004016" }
    ]
  },
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "353830078788@s.whatsapp.net", label: "MADRID", categoryFilter: "evento" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "monte carlo", "cannes", "\\bniza\\b", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" },
      { to: "34670652138@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento, habitacion" }
    ]
  },
  "marbella": {
    keywords: ["marbella", "puerto banus", "costa del sol", "malaga", "málaga", "estepona"],
    targets: [
      { to: "34670652138@s.whatsapp.net", label: "MARBELLA", categoryFilter: "evento, habitacion" }
    ]
  },
  "suiza": {
    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera", "zurigo"],
    targets: [
      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }
    ]
  },
  "amsterdam": {
    keywords: ["amsterdam", "holanda", "paises bajos", "netherlands", "nederland", "rotterdam", "la haya", "schiphol", "utrecht"],
    targets: [
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM" }
    ]
  },
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea", "\\buk\\b", "england", "inglaterra"],
    targets: [
      { to: "447438757923@s.whatsapp.net", label: "LONDON" }
    ]
  }
};

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
            if (kw.includes('\\b')) return new RegExp(kw, 'i').test(text);
            return text.includes(kw);
        })) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

matchedTargets = matchedTargets.filter(t => !t.categoryFilter || category.includes(t.categoryFilter) || t.categoryFilter.includes(category));

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

if (uniqueTargets.length === 0) return [{ json: { target_wa: "120363425790792660@g.us", city_label: "GLOBAL", city: leadData.city, text_es: leadData.text_es, platform: leadData.platform } }];

console.log("🚀 DRE ROUTED TO:", JSON.stringify(uniqueTargets));
return uniqueTargets.map(t => {
  const result = { 
    ...leadData, 
    target_wa: t.to, 
    city_label: t.label 
  };
  
  if (t.tg_chat) {
      result.tg_chat = t.tg_chat;
      if (t.label === 'RUSSIA_TURKEY') {
          result.tg_text = "*\ud83d\udce2 \u041d\u041e\u0412\u042b\u0419 \u041b\u0418\u0414 " + t.label + "*\\n\ud83d\udccd *" + (leadData.city || "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u043e") + "* | \ud83d\udcb0 *" + (leadData.budget || "\u0414\u043e\u0433\u043e\u0432\u043e\u0440\u043d\u0430\u044f") + "*\\n\\n" + (leadData.text_ru || leadData.text_es || "\u041d\u0435\u0442 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044f") + "\\n\\n\ud83d\udc64 *\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u0435\u043b\u044c:* " + (leadData.contact || "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439") + "\\n\ud83d\udd0c *\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a:* " + (leadData.platform || "WhatsApp");
      }
  }
  return { json: result };
});
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Dynamic Routing Engine':
            node['parameters']['jsCode'] = dre_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Successfully patched DRE to fix leadData access!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
