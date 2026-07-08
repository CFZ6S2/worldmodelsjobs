import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_data WHERE executionId = 162620")
    row = c.fetchone()
    
    data = json.loads(row['data'])
    print(json.dumps(data, indent=2))
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
