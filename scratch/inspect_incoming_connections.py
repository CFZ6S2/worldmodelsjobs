import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT connections FROM workflow_entity WHERE id='NO7NLZ5Kccp6jrOS'")
row = cur.fetchone()
if row:
    connections = json.loads(row[0])
    # Let's search for connections that mention "Message a model"
    for source_node, targets in connections.items():
        targets_str = json.dumps(targets)
        if 'Message a model' in targets_str:
            print(f"Source Node: {source_node} connects to Message a model")
            print(json.dumps(targets, indent=2))
conn.close()
