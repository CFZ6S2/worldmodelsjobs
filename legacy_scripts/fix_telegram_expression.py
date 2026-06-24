import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'
chat_id = '-1003900864818'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    nodes = json.loads(row[0])
    
    for n in nodes:
        if n['name'] == 'Telegram Link Alert':
            # FIX: jsonBody must be an EXPRESSION starting with =
            # so that n8n evaluates $json.link dynamically
            n['parameters']['jsonBody'] = f"={{{{ {{ \"chat_id\": \"{chat_id}\", \"text\": \"🔗 *Nuevo Grupo Detectado*\\n\\n📍 *Enlace:* \" + $json.link + \"\\n📱 *Plataforma:* \" + $json.platform + \"\\n🔌 *Fuente:* `\" + $json.source + \"`\", \"parse_mode\": \"Markdown\" }} }}}}"
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print("Telegram node patched with valid n8n expression.")

if __name__ == "__main__":
    patch()
