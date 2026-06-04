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
    js_code = node.get("parameters", {}).get("jsCode", "")
    json_body = node.get("parameters", {}).get("jsonBody", "")
    if "tg_chat" in js_code or "tg_text" in js_code or "tg_chat" in json_body or "tg_text" in json_body:
        print(f"--- {node.get('name')} ---")
        print(js_code)
        print(json_body)

conn.close()
