import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes, connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    if not row:
        print("Workflow not found!")
        exit(1)

    nodes = json.loads(row['nodes'])
    connections = json.loads(row['connections'])
    
    print("Nodes:")
    for node in nodes:
        print(f"- {node['name']}")
        
    print("\nConnections:")
    print(json.dumps(connections, indent=2))

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
