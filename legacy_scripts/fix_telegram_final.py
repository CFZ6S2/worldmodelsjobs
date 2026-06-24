import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'
bot_token = '8566658948:AAHA9Xz5epCbRPFVMfL8IJ33nmHtY0PTo5g'
chat_id = '-1003900864818'

def patch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print("Workflow not found.")
        return
    
    nodes = json.loads(row[0])
    
    # REPLACING THE TELEGRAM NODE WITH AN HTTP REQUEST NODE FOR STABILITY
    for i, n in enumerate(nodes):
        if n['name'] == 'Telegram Link Alert':
            nodes[i] = {
                "parameters": {
                    "method": "POST",
                    "url": f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": "={{ { \"chat_id\": \"" + chat_id + "\", \"text\": \"\ud83d\udd17 *Nuevo Grupo Detectado*\\nEnlace: \" + $json.link + \"\\n\ud83d\udcf1 Plataforma: \" + $json.platform + \"\\n\ud83d\udd0c Fuente: \" + $json.source, \"parse_mode\": \"Markdown\" } }}",
                    "options": {}
                },
                "id": n['id'],
                "name": "Telegram Link Alert",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": n['position']
            }
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print('FINAL PATCH SUCCESSFUL: Telegram Link Alert converted to HTTP Request.')

if __name__ == "__main__":
    patch()
