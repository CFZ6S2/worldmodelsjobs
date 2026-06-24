import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes, connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    connections = json.loads(row['connections'])
    
    print("Connections from Pre-Filter Unified1:")
    if 'Pre-Filter Unified1' in connections:
        print(json.dumps(connections['Pre-Filter Unified1'], indent=2))
    else:
        print("None")
        
    print("Connections to Pre-Filter Unified1:")
    for src, targets in connections.items():
        if 'main' in targets:
            for branch in targets['main']:
                for target in branch:
                    if target['node'] == 'Pre-Filter Unified1':
                        print(f"From {src}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
