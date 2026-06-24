import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, data FROM execution_data ORDER BY executionId DESC LIMIT 1")
    row = c.fetchone()
    
    if row:
        data = row['data']
        print(data[:2000])

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
