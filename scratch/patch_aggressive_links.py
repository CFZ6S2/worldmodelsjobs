import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print(f'CRITICAL ERROR: Workflow {target_id} not found in DB.')
        return
    
    nodes = json.loads(row[0])
    connections = json.loads(row[1])
    
    # NEW AGGRESSIVE EXTRACTOR CODE
    # Scans the ENTIRE JSON object as a string to find links anywhere
    link_extractor_js = """
const rawData = JSON.stringify($json);
const results = [];
// Regex muy amplio para pillar chat.whatsapp.com y wa.me (con o sin /invite/)
const linkRegex = /(?:https?:\\/\\/)?(?:chat\\.whatsapp\\.com|wa\\.me)\\/(?:invite\\/)?[a-zA-Z0-9_-]{10,50}/g;
const matches = rawData.match(linkRegex);

if (matches) {
  // Eliminamos duplicados en el mismo mensaje
  const uniqueMatches = [...new Set(matches)];
  
  for (let match of uniqueMatches) {
    // Normalizar a https://chat.whatsapp.com/...
    if (!match.startsWith("http")) {
      match = "https://" + match;
    }
    // Si es wa.me, lo dejamos pasar tal cual o lo marcamos
    
    results.push({ 
      json: { 
        link: match, 
        platform: $json.platform || "Unknown", 
        source: $json.source_chat_id || "Direct"
      } 
    });
  }
}
return results;
    """.strip()

    # Update Link Extractor Node
    found_extractor = False
    for n in nodes:
        if n['name'] == 'Link Extractor':
            n['parameters']['jsCode'] = link_extractor_js
            found_extractor = True
            break
    
    if not found_extractor:
        print("Link Extractor node not found by name, check manually.")
        return

    # RE-WIRE CONNECTIONS TO BE DIRECT FROM METADATA (BEFORE FILTERS)
    # 1. Remove from Pre-Filter Unified1 if it was there
    if "Pre-Filter Unified1" in connections:
        connections["Pre-Filter Unified1"]["main"][0] = [c for c in connections["Pre-Filter Unified1"]["main"][0] if c['node'] != 'Link Extractor']
    
    # 2. Add to Extract Metadata nodes
    for meta_node in ["Extract Metadata TG1", "Extract Metadata WA1"]:
        if meta_node in connections:
            if not any(c['node'] == 'Link Extractor' for c in connections[meta_node]["main"][0]):
                connections[meta_node]["main"][0].append({"node": "Link Extractor", "type": "main", "index": 0})

    cursor.execute('UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), json.dumps(connections), target_id))
    conn.commit()
    conn.close()
    print('PATCH SUCCESSFUL: Aggressive Link Extraction Enabled.')

if __name__ == "__main__":
    patch()
