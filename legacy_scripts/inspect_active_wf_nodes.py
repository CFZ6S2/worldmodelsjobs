import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ'")
row = cur.fetchone()
if row:
    nodes = json.loads(row[0])
    for n in nodes:
        print(f"Node: {n.get('name')} | Type: {n.get('type')}")
        # print parameters that could be relevant
        params = n.get('parameters', {})
        if params:
            # list non-empty parameters
            filtered = {k: v for k, v in params.items() if v}
            print(f"  Params: {filtered}")
conn.close()
