import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT nodes FROM workflow_entity WHERE id='NO7NLZ5Kccp6jrOS'")
row = cur.fetchone()
if row:
    nodes = json.loads(row[0])
    for n in nodes:
        # if the node uses credentials or mentions google/vertex/firebase
        if 'credentials' in n or any(k in str(n).lower() for k in ['google', 'vertex', 'firebase', 'gcp']):
            print(f"Node: {n.get('name')} | Type: {n.get('type')}")
            if 'credentials' in n:
                print(f"  Credentials: {n['credentials']}")
conn.close()
