import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, nodes FROM workflow_entity WHERE active=1")
for row in cur.fetchall():
    wf_id, name, nodes_str = row
    print(f"========================================\nACTIVE WORKFLOW: {wf_id} | {name}\n========================================")
    nodes = json.loads(nodes_str)
    for n in nodes:
        print(f"Node Name: {n.get('name')} | Type: {n.get('type')}")
conn.close()
