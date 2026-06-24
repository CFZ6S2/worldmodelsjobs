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
    nodes = json.loads(row[0])
    
    for n in nodes:
        if n['name'] == 'Telegram Link Alert':
            # Simplificamos al máximo el envío
            n['parameters'] = {
                "method": "POST",
                "url": f"https://api.telegram.org/bot{bot_token}/sendMessage",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": json.dumps({
                    "chat_id": chat_id,
                    "text": "LINK: {{ $json.link }}\nPLAT: {{ $json.platform }}\nSRC: {{ $json.source }}"
                }),
                "options": {}
            }
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print("Simplified Telegram node patched.")

if __name__ == "__main__":
    patch()
