import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, active, nodes FROM workflow_entity")
for row in cur.fetchall():
    wf_id, name, active, nodes_str = row
    nodes = json.loads(nodes_str)
    for n in nodes:
        node_str = json.dumps(n).lower()
        if 'gemini' in node_str or 'vertex' in node_str or 'google' in node_str:
            print(f"Workflow ID: {wf_id} | Name: {name} | Active: {active}")
            print(f"  Node: {n.get('name')} | Type: {n.get('type')}")
conn.close()
