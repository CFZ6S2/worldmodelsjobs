import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row[0])
for node in nodes:
    if node.get("name") == "Telegram Fanout":
        print(json.dumps(node, indent=2))
conn.close()
