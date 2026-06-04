import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ'")
row = cur.fetchone()
if row:
    nodes = json.loads(row[0])
    for n in nodes:
        if 'DeepSeek' in n.get('name', '') or 'deepseek' in n.get('type','').lower():
            print(json.dumps(n, indent=2))
conn.close()
