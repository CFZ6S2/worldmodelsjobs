import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'fP1vB4Y5OAgCbw0v'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes, connections, name FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print(f'CRITICAL ERROR: Workflow {target_id} not found in DB.')
        return
    
    nodes = json.loads(row[0])
    connections = json.loads(row[1])
    
    # Update Node Logic
    link_extractor_js = """
const text = $json.texto_limpio || "";
const results = [];
const linkRegex = /(?:https?:\\/\\/)?chat\\.whatsapp\\.com\\/[a-zA-Z0-9_-]{20,30}/g;
const matches = text.match(linkRegex);

if (matches) {
  for (let match of matches) {
    if (!match.startsWith("http")) {
      match = "https://" + match;
    }
    results.push({ 
      json: { 
        link: match, 
        platform: $json.platform, 
        source: $json.source_chat_id 
      } 
    });
  }
}
return results;
    """.strip()

    link_extractor = {
        'parameters': {
            'jsCode': link_extractor_js
        },
        'id': 'link-extractor-node-id',
        'name': 'Link Extractor',
        'type': 'n8n-nodes-base.code',
        'typeVersion': 1,
        'position': [-2496, 1104]
    }
    
    link_poster = {
        'parameters': {
            'chatId': '-1003900864818',
            'text': '=🔗 *Nuevo Grupo Detectado*\\nEnlace: {{ $json.link }}\\nPlataforma: {{ $json.platform }}\\nFuente: {{ $json.source }}',
            'additionalFields': {
                'parse_mode': 'Markdown'
            }
        },
        'id': 'link-poster-node-id',
        'name': 'Telegram Link Alert',
        'type': 'n8n-nodes-base.telegram',
        'typeVersion': 1,
        'position': [-2304, 1104],
        'credentials': {
            'telegramApi': {
                'id': 'wNTTBS9Bhu4RrC6o',
                'name': 'Telegram account'
            }
        }
    }

    # Upsert nodes
    for target_node in [link_extractor, link_poster]:
        found = False
        for i, n in enumerate(nodes):
            if n['name'] == target_node['name']:
                nodes[i] = target_node
                found = True
                break
        if not found:
            nodes.append(target_node)

    # RE-WIRE CONNECTIONS
    # 1. Remove from Pre-Filter if exists
    if "Pre-Filter Unified1" in connections:
        connections["Pre-Filter Unified1"]["main"][0] = [c for c in connections["Pre-Filter Unified1"]["main"][0] if c['node'] != 'Link Extractor']
    
    # 2. Add to Extract Metadata TG1 and WA1 (to capture everything before spam filters)
    for meta_node in ["Extract Metadata TG1", "Extract Metadata WA1"]:
        if meta_node in connections:
            if not any(c['node'] == 'Link Extractor' for c in connections[meta_node]["main"][0]):
                connections[meta_node]["main"][0].append({"node": "Link Extractor", "type": "main", "index": 0})
    
    # 3. Ensure Link Extractor points to Telegram Link Alert
    connections["Link Extractor"] = {"main": [[{"node": "Telegram Link Alert", "type": "main", "index": 0}]]}

    cursor.execute('UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), json.dumps(connections), target_id))
    conn.commit()
    conn.close()
    print('PATCH SUCCESSFUL (Nodes re-wired to metadata outputs).')

if __name__ == "__main__":
    patch()
