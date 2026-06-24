import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_entity WHERE id = 162646")
    row = c.fetchone()
    
    data = json.loads(row['data'])
    
    # Just print the output of Dynamic Routing Engine
    for result in data['resultData']['runData']['Dynamic Routing Engine']:
        print(json.dumps(result['data']['main'], indent=2))
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
