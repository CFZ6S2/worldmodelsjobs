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

    # Get data of the latest execution
    c.execute("SELECT id FROM execution_entity ORDER BY id DESC LIMIT 1")
    exec_id = c.fetchone()['id']

    c.execute("SELECT data FROM execution_data WHERE executionId = ?", (exec_id,))
    row = c.fetchone()
    if row:
        data = json.loads(row['data'])
        if 'resultData' in data and 'error' in data['resultData']:
             print("\nGLOBAL ERROR:", json.dumps(data['resultData']['error'], indent=2))
        
        if 'resultData' in data and 'runData' in data['resultData']:
            for node_name, node_data in data['resultData']['runData'].items():
                for run in node_data:
                    if 'error' in run:
                        print(f"\nERROR IN {node_name}:", json.dumps(run['error'], indent=2))

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
