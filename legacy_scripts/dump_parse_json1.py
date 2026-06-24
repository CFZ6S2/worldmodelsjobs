import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id FROM execution_entity ORDER BY id DESC LIMIT 1")
    exec_id = c.fetchone()['id']
    
    c.execute("SELECT data FROM execution_data WHERE executionId = ?", (exec_id,))
    row = c.fetchone()
    if row:
        data = json.loads(row['data'])
        if 'resultData' in data and 'runData' in data['resultData']:
            for node_name in ['Webhook WhatsApp', 'Extract Metadata WA1', 'Parse JSON1']:
                if node_name in data['resultData']['runData']:
                    print(f"--- {node_name} Output ---")
                    for run in data['resultData']['runData'][node_name]:
                        if 'data' in run and 'main' in run['data']:
                            for item in run['data']['main'][0]:
                                print(json.dumps(item['json'], indent=2))
                else:
                    print(f"--- {node_name} DID NOT EXECUTE ---")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
