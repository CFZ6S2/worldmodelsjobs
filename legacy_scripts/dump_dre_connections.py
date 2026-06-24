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
    
    if 'Dynamic Routing Engine' in connections:
        print("Dynamic Routing Engine connects TO:")
        print(json.dumps(connections['Dynamic Routing Engine'], indent=2))
    else:
        print("Dynamic Routing Engine has no outgoing connections.")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
