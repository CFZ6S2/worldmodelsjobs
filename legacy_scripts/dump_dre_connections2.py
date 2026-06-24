import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    connections = json.loads(row['connections'])
    
    print("Connections FROM Dynamic Routing Engine:")
    if 'Dynamic Routing Engine' in connections:
        print(json.dumps(connections['Dynamic Routing Engine'], indent=2))
        
    print("Connections TO Dynamic Routing Engine:")
    for src, targets in connections.items():
        if 'main' in targets:
            for branch in targets['main']:
                for target in branch:
                    if target['node'] == 'Dynamic Routing Engine':
                        print(f"From {src}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
