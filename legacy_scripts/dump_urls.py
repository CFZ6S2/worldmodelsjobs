import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row[0])

for node in nodes:
    if node.get("type") == "n8n-nodes-base.httpRequest":
        print(f"Node: {node.get('name')}")
        url = node.get("parameters", {}).get("url", "")
        print(f"URL: {url}")

conn.close()
