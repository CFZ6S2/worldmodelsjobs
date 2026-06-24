import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
wf_id = row[0]
nodes = json.loads(row[1])

modified = False
for node in nodes:
    if node.get("name") == "Dynamic Routing Engine":
        js_code = node.get("parameters", {}).get("jsCode", "")
        if '"uk"' in js_code:
            new_code = js_code.replace('"uk"', '"\\\\buk\\\\b"')
            node["parameters"]["jsCode"] = new_code
            modified = True

if modified:
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?", (json.dumps(nodes), wf_id))
    conn.commit()
    print("Database patched uk successfully!")
else:
    print("No changes made.")

conn.close()
