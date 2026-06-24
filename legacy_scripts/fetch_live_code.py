import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row[0])

for node in nodes:
    if node.get("name") in ["Message Router", "Dynamic Routing Engine", "Dynamic WhatsApp Alert"]:
        print(f"=== {node.get('name')} ===")
        if "jsCode" in node.get("parameters", {}):
            print(node["parameters"]["jsCode"])
        if "jsonBody" in node.get("parameters", {}):
            print(node["parameters"]["jsonBody"])

conn.close()
