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
        if isinstance(data, dict):
            print("It's a dict. Keys:", list(data.keys()))
            if 'resultData' in data:
                 if 'runData' in data['resultData']:
                      print("RunData keys:", list(data['resultData']['runData'].keys()))
        elif isinstance(data, list):
            print("It's a list of length:", len(data))
            if len(data) > 0:
                print("First element type:", type(data[0]))
                if isinstance(data[0], dict):
                    print("First element keys:", list(data[0].keys()))
                
                print("Dumping first 1000 chars of data:")
                print(json.dumps(data)[:1000])

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
