import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, nodes FROM workflow_entity WHERE active=1")
for row in cur.fetchall():
    wf_id, name, nodes_str = row
    nodes = json.loads(nodes_str)
    for n in nodes:
        if 'googleGemini' in n.get('type','') or n.get('name') == 'Message a model' or 'gemini' in str(n).lower() or 'vertex' in str(n).lower():
            print(f"Workflow ID: {wf_id} | Name: {name}")
            print(json.dumps(n, indent=2))
            # Let's print the entire node structure including credentials
conn.close()
