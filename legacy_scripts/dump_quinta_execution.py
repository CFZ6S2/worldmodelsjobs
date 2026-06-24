import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, status, stoppedAt FROM execution_entity ORDER BY id DESC LIMIT 5")
    rows = c.fetchall()
    
    for row in rows:
        print(f"Execution {row['id']} - Status: {row['status']} - StoppedAt: {row['stoppedAt']}")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
