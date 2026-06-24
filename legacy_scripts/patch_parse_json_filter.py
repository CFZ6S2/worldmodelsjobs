import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

parse_json_code = """
let parsed = {};
try {
  const jsonStr = $input.all()[0].json.text || "{}";
  parsed = JSON.parse(jsonStr.replace(/```json\\n/g, '').replace(/\\n```/g, ''));
} catch (e) {}

let originalText = "";
let preFilterItem = null;

try {
  preFilterItem = $('Pre-Filter Unified1').item.json;
  originalText = preFilterItem.texto_limpio || "";
} catch(e) {
  try {
    originalText = $('Dedup Hash1').item.json.texto_limpio || "";
  } catch(e2) {
    originalText = $input.all()[0].json.texto_limpio || $input.all()[0].json.text_es || "";
  }
}

const lowerRaw = originalText.toLowerCase();
const isJobish = lowerRaw.includes("busco") || lowerRaw.includes("disponible") || lowerRaw.includes("casting") || lowerRaw.includes("tour") || lowerRaw.length > 20;

const finalData = {
  ...$input.all()[0].json,
  ...parsed,
  text_es: parsed.text_es || originalText || "Sin descripción",
  texto_limpio: originalText,
  city: (parsed.city || "global").toLowerCase(),
  category: (parsed.category || (isJobish ? "evento" : "trash")).toLowerCase(),
  platform: parsed.platform || $input.all()[0].json.platform || "telegram",
  trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false
};

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "eivissa", "mansur", "monaco", "viena", "vienna", "dubai", "suiza", "switzerland", "london", "londres"];
if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
}

if (preFilterItem && preFilterItem.looksValuable === false) {
  finalData.category = "trash";
  finalData.trash = true;
}

return [{ json: finalData }];
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Parse JSON1':
            node['parameters']['jsCode'] = parse_json_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Patched Parse JSON1 to enforce Pre-Filter blocked items!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
