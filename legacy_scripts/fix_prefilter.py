import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Pre-Filter corregido: SOLO pasan los que NO son basura. Los que coinciden con HARD_BLOCK o prefix baneado se ELIMINAN.
prefilter_fixed = """
const results = [];
const HARD_BLOCK = new Set(["crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", "ingles", "english"]);
const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244"];

function norm(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }

for (const item of $input.all()) {
  const data = item.json;
  const text = norm(data.texto_limpio);
  const sender = String(data.final_contact || data.from || "").replace(/\\D/g, "");

  // Bloquear por prefijo baneado
  if (BANNED_PREFIXES.some(p => sender.startsWith(p))) continue;
  
  // Bloquear por palabra clave prohibida
  if ([...HARD_BLOCK].some(k => text.includes(k))) continue;
  
  // Si no hay texto, no tiene sentido enviarlo a la IA
  if (!text || text.length < 10) continue;

  // Solo los que pasan todos los filtros salen del nodo
  results.push(item);
}
return results;
"""

# Dedup Hash1 corregido: mismo texto + mismo sender en menos de 5 minutos = duplicado
dedup_fixed = """
const results = [];
const store = $getWorkflowStaticData('global');
if (!store.history) store.history = [];

const now = Date.now();
const TTL = 5 * 60 * 1000;
store.history = store.history.filter(h => now - h.time < TTL);

for (const item of $input.all()) {
  const fp = String(item.json.texto_limpio || '').substring(0, 100);
  const sender = String(item.json.sender_contact || item.json.from || '');

  if (!store.history.some(h => h.fp === fp && h.sender === sender)) {
    store.history.push({ time: now, fp, sender });
    results.push(item);
  }
}
return results;
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    
    if row:
        nodes = json.loads(row['nodes'])
        changes = []
        
        for node in nodes:
            name = node.get('name', '')
            
            if name == 'Pre-Filter Unified1':
                node['parameters']['jsCode'] = prefilter_fixed
                changes.append("Pre-Filter Unified1: FIXED - ahora ELIMINA basura en vez de solo etiquetarla")
            
            elif name == 'Dedup Hash1':
                node['parameters']['jsCode'] = dedup_fixed
                changes.append("Dedup Hash1: FIXED - 5 min TTL + mismo sender")
                
        if changes:
            c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
            conn.commit()
            for change in changes:
                print(change)
            print("\nDatabase updated successfully.")
        else:
            print("No changes needed.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
