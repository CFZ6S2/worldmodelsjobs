import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get the last 20 executions
    c.execute("SELECT id, data FROM execution_entity ORDER BY id DESC LIMIT 20")
    rows = c.fetchall()
    
    found_parse = False
    for row in rows:
        data = json.loads(row['data'])
        if isinstance(data, dict) and 'resultData' in data and 'runData' in data['resultData']:
            run_data = data['resultData']['runData']
            if 'Parse JSON1' in run_data:
                print(f"--- Execution {row['id']} -> Parse JSON1 Output ---")
                for run in run_data['Parse JSON1']:
                    if 'data' in run and 'main' in run['data']:
                        for item in run['data']['main'][0]:
                            if 'json' in item:
                                print(json.dumps(item['json'], indent=2))
                found_parse = True
                
            if 'Dynamic Routing Engine' in run_data:
                print(f"--- Execution {row['id']} -> Dynamic Routing Engine Output ---")
                for run in run_data['Dynamic Routing Engine']:
                    if 'data' in run and 'main' in run['data']:
                        for item in run['data']['main'][0]:
                            if 'json' in item:
                                print(json.dumps(item['json'], indent=2))
        
        if found_parse:
            break

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
