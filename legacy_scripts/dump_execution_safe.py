import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get recent execution IDs
    c.execute("SELECT executionId FROM execution_data ORDER BY rowid DESC LIMIT 5")
    rows = c.fetchall()
    
    for row in rows:
        exec_id = row['executionId']
        c.execute("SELECT data FROM execution_data WHERE executionId = ?", (exec_id,))
        data_row = c.fetchone()
        if not data_row: continue
        
        data = json.loads(data_row['data'])
        if isinstance(data, dict) and 'resultData' in data and 'runData' in data['resultData']:
            run_data = data['resultData']['runData']
            print(f"--- Execution {exec_id} ---")
            
            if 'Parse JSON1' in run_data:
                print(f"  -> Parse JSON1 Output:")
                for run in run_data['Parse JSON1']:
                    if 'data' in run and 'main' in run['data']:
                        for item in run['data']['main'][0]:
                            if 'json' in item:
                                print("    ", json.dumps(item['json']))
                                
            if 'Dynamic Routing Engine' in run_data:
                print(f"  -> Dynamic Routing Engine Output:")
                for run in run_data['Dynamic Routing Engine']:
                    if 'data' in run and 'main' in run['data']:
                        for item in run['data']['main'][0]:
                            if 'json' in item:
                                print("    ", json.dumps(item['json']))

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
