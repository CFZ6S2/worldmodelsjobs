import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            print("--- Dynamic Routing Engine Code ---")
            code = node['parameters']['jsCode']
            print(code[:2000])
            print("...")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
