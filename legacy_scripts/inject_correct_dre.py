import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

new_code = """
const leadData = $json;
const category = String(leadData.category || 'evento').toLowerCase().trim();
const cityDetected = String(leadData.city || 'global').toLowerCase().trim();
const text = String(leadData.text_es || leadData.texto_limpio || '').toLowerCase();

// Function to normalize diacritics
function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
}
const cityNormalized = normalize(cityDetected);
const textNormalized = normalize(text);

const routingTable = {
  "russia_turkey": {
    keywords: ["rusia", "russia", "\\\\bru\\\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: [
      { to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", categoryFilter: "evento" }
    ]
  },
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "353830078788@s.whatsapp.net", label: "MADRID", categoryFilter: "evento" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento" },
      { to: "34670652138@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento" }
    ]
  },
  "marbella": {
    keywords: ["marbella", "puerto banus", "costa del sol", "malaga", "málaga", "estepona"],
    targets: [
      { to: "34670652138@s.whatsapp.net", label: "MARBELLA", categoryFilter: "evento" }
    ]
  }
};

let matchedTargets = [];

if (routingTable[cityNormalized]) {
    matchedTargets = [...routingTable[cityNormalized].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityNormalized.includes(key) || config.keywords.some(kw => cityNormalized.includes(normalize(kw)))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

// Category filter
matchedTargets = matchedTargets.filter(t => !t.categoryFilter || category.includes(t.categoryFilter) || t.categoryFilter.includes(category));

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

// If no matching rules, return empty so it doesn't send anything dynamically!
if (uniqueTargets.length === 0) {
    return [];
}

return uniqueTargets.map(t => {
    const result = { ...leadData };
    result.target_wa = t.to;
    result.city_label = t.label;
    return { json: result };
});
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Dynamic Routing Engine':
            node['parameters']['jsCode'] = new_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("DRE patched successfully!")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
