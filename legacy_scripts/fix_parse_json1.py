import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

parse_json_code = """
// PARSE JSON v5.8 (FIXED TEXT FORWARDING)
const input = $json;
const rawText = input.output || input.text || "";
const cleanText = rawText.replace(/```json|```/g, '').trim();

let parsed = {};
try {
  if (cleanText) parsed = JSON.parse(cleanText);
} catch (e) {
  const catMatch = cleanText.match(/"category"\\s*:\\s*"(.*?)"/i);
  const cityMatch = cleanText.match(/"city"\\s*:\\s*"(.*?)"/i);
  if (catMatch) parsed.category = catMatch[1];
  if (cityMatch) parsed.city = cityMatch[1];
}

// Safely get texto_limpio from Dedup Hash1
let originalText = "";
try {
    originalText = $('Dedup Hash1').item.json.texto_limpio || "";
} catch(e) {
    try {
        originalText = $('Pre-Filter Unified1').item.json.texto_limpio || "";
    } catch(err) {}
}

const lowerRaw = originalText.toLowerCase();
const isJobish = lowerRaw.includes("busco") || lowerRaw.includes("disponible") || lowerRaw.includes("casting") || lowerRaw.includes("tour") || lowerRaw.length > 20;

const finalData = {
  platform: input.platform || "WhatsApp",
  contact: input.sender_contact || input.final_contact || "Desconocido",
  source_chat_id: input.source_chat_id || "0",
  city: parsed.city || "Global",
  budget: parsed.budget || "Negociable",
  category: (parsed.category || (isJobish ? "evento" : "trash")).toLowerCase(),
  text_es: parsed.text_es || originalText || "Sin descripción",
  title_es: parsed.title_es || (originalText ? originalText.substring(0, 40) : "Nuevo Lead"),
  trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false
};

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "eivissa", "mansur", "monaco", "viena", "vienna", "dubai", "suiza", "switzerland", "london", "londres"];
if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
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
    print("Successfully patched Parse JSON1 to fix text_es dropout!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
