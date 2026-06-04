import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    nodes = json.loads(row[0])
    
    extractor_code = """
const rawData = JSON.stringify($json);
const linkRegex = /(?:https?:\\/\\/)?(?:chat\\.whatsapp\\.com|wa\\.me)\\/(?:invite\\/)?[a-zA-Z0-9_-]{10,50}/g;
let matches = rawData.match(linkRegex) || [];

// Buscar explícitamente códigos de invitación directos de Whapi
const inviteCodeRegex = /"invite_code"\\s*:\\s*"([a-zA-Z0-9_-]{10,50})"/g;
let m;
while ((m = inviteCodeRegex.exec(rawData)) !== null) {
    matches.push('https://chat.whatsapp.com/' + m[1]);
}

// Si la plataforma mandó el enlace suelto o sin https://
if (matches && matches.length > 0) {
  const uniqueMatches = [...new Set(matches)];
  return uniqueMatches.map(matchStr => ({ 
    json: { 
      link: matchStr.startsWith('http') ? matchStr : 'https://' + matchStr, 
      platform: $json.platform || 'WhatsApp', 
      source: $json.source_chat_id || 'Direct' 
    } 
  }));
}
return []; // No mandamos nada si no hay link
""".strip()
    
    for n in nodes:
        if n['name'] == 'Link Extractor':
            n['parameters']['jsCode'] = extractor_code
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print("Link Extractor patched to support raw invite_codes.")

if __name__ == "__main__":
    patch()
