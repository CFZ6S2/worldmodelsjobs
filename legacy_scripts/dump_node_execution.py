import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, stoppedAt FROM execution_entity ORDER BY id DESC LIMIT 20")
    rows = c.fetchall()
    
    for row in rows:
        exec_id = row['id']
        c.execute("SELECT data FROM execution_data WHERE executionId = ?", (exec_id,))
        data_row = c.fetchone()
        if data_row:
            data_str = data_row['data']
            if 'RUSSIA_TURKEY' in data_str or 'Bodrum' in data_str or 'Sochi' in data_str:
                print(f"FOUND MATCH IN EXECUTION {exec_id}!")
                print(data_str[:500])

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
