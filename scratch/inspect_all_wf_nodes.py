import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, active, nodes FROM workflow_entity")
for row in cur.fetchall():
    wf_id, name, active, nodes_str = row
    nodes = json.loads(nodes_str)
    for n in nodes:
        node_str = json.dumps(n).lower()
        if 'gemini' in node_str or 'vertex' in node_str or 'googlel' in node_str or 'googlepalm' in node_str:
            print(f"Workflow ID: {wf_id} | Name: {name} | Active: {active}")
            print(f"  Node Name: {n.get('name')} | Type: {n.get('type')}")
            if 'credentials' in n:
                print(f"    Credentials: {n['credentials']}")
conn.close()
