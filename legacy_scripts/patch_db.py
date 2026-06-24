import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow not found!")
    exit(1)

nodes_str = row[1]
nodes = json.loads(nodes_str)

new_code = """// DYNAMIC ROUTING ENGINE v7.1 (CLEAN CLIENTS ONLY)
let leadData = $input.first().json;
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

for (const [key, config] of Object.entries(routingTable)) {
    if (config.keywords.some(kw => textNorm.includes(kw) || cityNorm.includes(kw))) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}

// 2. FALLBACK: Global feed (Cualquier ciudad que no coincida con cliente)
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
}));"""

found = False
for node in nodes:
    if node.get("name") == "Dynamic Routing Engine":
        node["parameters"]["jsCode"] = new_code
        found = True

if found:
    new_nodes_str = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_str,))
    conn.commit()
    print("Database patched successfully!")
else:
    print("Node not found!")

conn.close()
