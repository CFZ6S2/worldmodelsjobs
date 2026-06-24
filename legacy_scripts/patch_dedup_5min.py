import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

new_js_code = """
const results = [];
const store = $getWorkflowStaticData('global');
if (!store.history) store.history = [];

const now = Date.now();
// 5 minutes TTL
const TTL = 5 * 60 * 1000; 
store.history = store.history.filter(h => now - h.time < TTL);

for (const item of $input.all()) {
  const fp = String(item.json.texto_limpio || '').substring(0, 100);
  const sender = String(item.json.sender_contact || item.json.from || '');
  
  // Si encontramos el mismo texto (100 caracteres) del MISMO remitente en el historial (q es maximo 5 min), lo filtramos
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
        modified = False
        for node in nodes:
            if node['name'] == 'Dedup Hash1':
                node['parameters']['jsCode'] = new_js_code
                modified = True
                print("Patched Dedup Hash1 for 5 minute + same sender rule")
                break
                
        if modified:
            c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
            conn.commit()
            print("Database updated successfully.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
