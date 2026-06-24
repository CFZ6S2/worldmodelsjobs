import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow not found!")
    exit(1)

nodes = json.loads(row[0])
for node in nodes:
    if 'Telegram' in node.get("name"):
        print(f"--- {node.get('name')} ---")
        print(node.get("parameters", {}).get("jsCode", "No jsCode"))

conn.close()
