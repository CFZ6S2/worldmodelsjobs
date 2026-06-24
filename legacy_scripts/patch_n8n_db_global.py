import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'fP1vB4Y5OAgCbw0v'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print(f'CRITICAL ERROR: Workflow {target_id} not found in DB.')
        return
    
    nodes = json.loads(row[0])
    
    # Update Dynamic Routing Engine to be GLOBAL and PERMISSIVE
    routing_js = """
// GLOBAL ROUTING ENGINE v6.0 (WORLDWIDE COMPATIBLE)
let leadData = {};
try { leadData = $json; } catch(e) { return []; }

const category = String(leadData.category || 'evento').toLowerCase();
const city = String(leadData.city || 'global').toLowerCase();

// Destinos específicos por ciudad
const routingTable = {
  "madrid": ["34664266926@s.whatsapp.net", "34603346859@s.whatsapp.net"],
  "ibiza": ["34662058447@s.whatsapp.net", "34642107796@s.whatsapp.net"],
  "london": ["120363425790792660@g.us"],
  "miami": ["17862812324@s.whatsapp.net", "525532110621@s.whatsapp.net"],
  "paris": ["33744156314@s.whatsapp.net"]
};

let targets = [];

// 1. Si la ciudad está en la tabla, usamos esos números
if (routingTable[city]) {
    targets = routingTable[city];
} 

// 2. FALLBACK GLOBAL: Si es evento/plaza, mandamos a GLOBAL pase lo que pase
if (targets.length === 0 && (category === 'evento' || category === 'plaza')) {
    targets.push("120363425790792660@g.us");
}

if (targets.length === 0) return [];

return targets.map(to => ({
  json: { 
    ...leadData, 
    target_wa: to,
    city_label: city.toUpperCase()
  }
}));
    """.strip()

    for n in nodes:
        if n['name'] == 'Dynamic Routing Engine':
            n['parameters']['jsCode'] = routing_js
            break

    cursor.execute('UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print('PATCH SUCCESSFUL: Global Routing Enabled.')

if __name__ == "__main__":
    patch()
