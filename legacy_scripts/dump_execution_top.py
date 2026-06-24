import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id FROM execution_entity ORDER BY id DESC LIMIT 1")
    exec_id = c.fetchone()['id']
    print("Execution ID:", exec_id)

    c.execute("SELECT data FROM execution_data WHERE executionId = ?", (exec_id,))
    row = c.fetchone()
    if row:
        data = json.loads(row['data'])
        print("Data keys:", list(data.keys()))
        if 'resultData' in data:
             print("resultData keys:", list(data['resultData'].keys()))
             if 'runData' in data['resultData']:
                 print("runData keys:", list(data['resultData']['runData'].keys()))

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
