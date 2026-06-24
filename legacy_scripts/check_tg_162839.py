import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_data WHERE executionId = 162839")
    row = c.fetchone()
    data = json.loads(row['data'])
    
    mapping = None
    for item in data:
        if isinstance(item, dict) and 'Telegram Fanout' in item:
            mapping = item
            break
            
    if mapping:
        idx_str = mapping['Telegram Fanout']
        node_runs_idx = data[int(idx_str)]
        
        def unflat(idx):
            if not isinstance(idx, str) or not idx.isdigit():
                return idx
            val = data[int(idx)]
            if isinstance(val, dict):
                return {k: unflat(v) for k, v in val.items()}
            if isinstance(val, list):
                return [unflat(v) for v in val]
            return val
            
        for i, run_idx_str in enumerate(node_runs_idx):
            run = data[int(run_idx_str)]
            if 'error' in run:
                print(f"Error in Telegram Fanout: {run['error']}")
            else:
                run_data = unflat(run['data'])
                print(f"Telegram Fanout Output {i}: {json.dumps(run_data, indent=2)}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
