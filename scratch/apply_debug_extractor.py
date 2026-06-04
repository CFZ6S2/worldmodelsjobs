import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def debug():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    nodes = json.loads(row[0])
    
    debug_code = """
const rawData = JSON.stringify($json);
const linkRegex = /(?:https?:\\/\\/)?(?:chat\\.whatsapp\\.com|wa\\.me)\\/(?:invite\\/)?[a-zA-Z0-9_-]{10,50}/g;
const matches = rawData.match(linkRegex);

if (matches) {
  const uniqueMatches = [...new Set(matches)];
  return uniqueMatches.map(m => ({ json: { link: m.startsWith('http') ? m : 'https://' + m, platform: $json.platform || 'WA', source: $json.source_chat_id || 'Direct' } }));
}

// DEBUG: Mandamos aviso si no hay link para saber que el flujo funciona
return [{ json: { link: 'DEBUG_NO_LINK_FOUND', platform: $json.platform || 'WA', source: $json.source_chat_id || 'Direct' } }];
""".strip()
    
    for n in nodes:
        if n['name'] == 'Link Extractor':
            n['parameters']['jsCode'] = debug_code
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print("Debug script updated.")

if __name__ == "__main__":
    debug()
