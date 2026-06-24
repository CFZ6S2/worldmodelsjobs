import sqlite3
import json
import urllib.request
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row[0])

webhook_url = None
for node in nodes:
    if node.get("type") == "n8n-nodes-base.webhook":
        path = node.get("parameters", {}).get("path", "")
        if path:
            webhook_url = f"http://localhost:5678/webhook/{path}"
            break

conn.close()

if not webhook_url:
    print("Could not find webhook URL")
    exit(1)

print(f"Triggering webhook: {webhook_url}")

payload = {
    "body": {
        "text": "Se busca chica para evento en London mañana. Presupuesto 1000£. Contactar urgente.",
        "chat_id": "-100123456789"
    }
}

req = urllib.request.Request(webhook_url, json.dumps(payload).encode('utf-8'), {'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error triggering webhook:", e)
