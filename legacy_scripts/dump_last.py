import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT executionId as id, data FROM execution_data ORDER BY executionId DESC LIMIT 1")
    row = c.fetchone()
    
    with open('/root/worldmodels-jobs/last_execution.json', 'w') as f:
        f.write(row['data'])
            
    conn.close()
    print("Dumped to last_execution.json")
except Exception as e:
    print(f"Error: {e}")
