import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'
bot_token = '8566658948:AAHA9Xz5epCbRPFVMfL8IJ33nmHtY0PTo5g'
chat_id = '-1003900864818'

def finalize():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    nodes = json.loads(row[0])
    
    # 1. CLEAN LINK EXTRACTOR (REMOVE DEBUG)
    extractor_code = """
const rawData = JSON.stringify($json);
const linkRegex = /(?:https?:\\/\\/)?(?:chat\\.whatsapp\\.com|wa\\.me)\\/(?:invite\\/)?[a-zA-Z0-9_-]{10,50}/g;
const matches = rawData.match(linkRegex);

if (matches) {
  const uniqueMatches = [...new Set(matches)];
  return uniqueMatches.map(m => ({ 
    json: { 
      link: m.startsWith('http') ? m : 'https://' + m, 
      platform: $json.platform || 'WhatsApp', 
      source: $json.source_chat_id || 'Direct' 
    } 
  }));
}
return []; // No mandamos nada si no hay link
""".strip()

    # 2. BEAUTIFY TELEGRAM ALERT
    tg_text = "🔗 *Nuevo Grupo Detectado*\\n\\n📍 *Enlace:* {{ $json.link }}\\n📱 *Plataforma:* {{ $json.platform }}\\n🔌 *Fuente:* `{{ $json.source }}`"
    
    for n in nodes:
        if n['name'] == 'Link Extractor':
            n['parameters']['jsCode'] = extractor_code
        if n['name'] == 'Telegram Link Alert':
            n['parameters']['jsonBody'] = json.dumps({
                "chat_id": chat_id,
                "text": tg_text,
                "parse_mode": "Markdown"
            })
            
    cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print("Workflow finalized and beautified.")

if __name__ == "__main__":
    finalize()
