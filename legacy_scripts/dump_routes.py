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
        if node.get('name') in ['Message Router', 'Dynamic Routing Engine']:
            print(f"--- Node: {node.get('name')} ---")
            print(node['parameters']['jsCode'])
            print("\n")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
