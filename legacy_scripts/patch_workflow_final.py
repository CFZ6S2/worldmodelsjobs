import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

dre_code = """
console.log("🚀 DRE CALLED WITH LEAD:", JSON.stringify($json));
function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
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

if (uniqueTargets.length === 0) return [];

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

wa_alert_code = """={{ (() => {
  const target = $json.target_wa || '';
  const label = ($json.city_label || '').toUpperCase().trim();
  
  if (label === 'RUSSIA_TURKEY') {
    return { 
       "to": target, 
       "body": "*\ud83d\udce2 NEW LEAD " + label + "*\\n\ud83d\udccd *" + ($json.city || "Unknown") + "* | \ud83d\udcb0 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_en || $json.text_es || "No description") + "\\n\\n\ud83d\udc64 *Sender:* " + ($json.contact || "Unknown") + "\\n\ud83d\udd0c *Source:* " + ($json.platform || "WhatsApp") 
    };
  }
  else if (label === 'COSTA AZUL' || label === 'MADRID (PT)') {
    return { "to": target, "body": "*\ud83d\udce2 ALERTA COSTA AZUL*\\n\ud83d\udccd *" + ($json.city || "Desconhecida") + "* | \ud83d\udcb0 *" + ($json.budget || "Negoci\u00e1vel") + "*\\n\\n" + ($json.text_pt || $json.text_es || "Sem descri\u00e7\u00e3o") + "\\n\\n\ud83d\udc64 *Remetente:* " + ($json.contact || "Desconhecido") + "\\n\ud83d\udd0c *Fonte:* " + ($json.platform || "WhatsApp") };
  }
  else if (label === 'LONDON' || label === 'LONDRES') {
    return { "to": target, "body": "*\ud83d\udce2 LONDON ALERT*\\n\ud83d\udccd *" + ($json.city || "Unknown") + "* | \ud83d\udcb0 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_en || $json.text_es || "No description") + "\\n\\n\ud83d\udc64 *Contact:* " + ($json.contact || "Unknown") + "\\n\ud83d\udd0c *Source:* " + ($json.platform || "WhatsApp") };
  }
  else {
    return { "to": target, "body": "*\ud83d\udce2 ALERTA " + (label || "GLOBAL") + "*\\n\ud83d\udccd *" + ($json.city || "Desconocida") + "* | \ud83d\udcb0 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripci\u00f3n") + "\\n\\n\ud83d\udc64 *Remitente:* " + ($json.contact || "Desconocido") + "\\n\ud83d\udd0c *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes, connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    connections = json.loads(row['connections'])
    
    for node in nodes:
        if node['name'] == 'Dynamic Routing Engine':
            node['parameters']['jsCode'] = dre_code
        elif node['name'] == 'Dynamic WhatsApp Alert':
            node['parameters']['jsonBody'] = wa_alert_code

    if 'Dynamic Routing Engine' in connections:
        main_outputs = connections['Dynamic Routing Engine'].get('main', [[]])[0]
        # Check if Telegram Fanout is already there
        has_telegram = False
        for out in main_outputs:
            if out['node'] == 'Telegram Fanout':
                has_telegram = True
        
        if not has_telegram:
            main_outputs.append({
                "node": "Telegram Fanout",
                "type": "main",
                "index": 0
            })
            connections['Dynamic Routing Engine']['main'] = [main_outputs]

    new_nodes = json.dumps(nodes)
    new_connections = json.dumps(connections)
    c.execute("UPDATE workflow_entity SET nodes = ?, connections = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes, new_connections))
    conn.commit()
    print("Successfully patched workflow to support English WhatsApp and Russian Telegram for Russia/Turkey!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
