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

    c.execute("SELECT data FROM execution_entity ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    if row:
        data = json.loads(row['data'])
        print("\nLast Execution Data:")
        if 'resultData' in data and 'runData' in data['resultData']:
            # Find the Dynamic Routing Engine output
            for node_name, node_data in data['resultData']['runData'].items():
                if 'Dynamic Routing Engine' in node_name:
                    print(f"--- {node_name} Output ---")
                    for run in node_data:
                        if 'data' in run and 'main' in run['data']:
                            for item in run['data']['main'][0]:
                                print(item['json'])

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
