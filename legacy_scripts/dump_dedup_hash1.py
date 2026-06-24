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
    
    print("Dedup Hash1 Connects To:")
    if 'Dedup Hash1' in connections:
        print(json.dumps(connections['Dedup Hash1'], indent=2))
    else:
        print("Not found")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
