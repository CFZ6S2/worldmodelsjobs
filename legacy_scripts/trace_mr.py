import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_data WHERE executionId = 162620")
    row = c.fetchone()
    data = json.loads(row['data'])
    
    mapping = None
    for item in data:
        if isinstance(item, dict) and 'Message Router' in item:
            mapping = item
            break
            
    if mapping:
        idx_str = mapping['Message Router']
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
            
        runs = []
        for run_idx_str in node_runs_idx:
            runs.append(data[int(run_idx_str)])
            
        for i, run in enumerate(runs):
            data_idx = run['data']
            run_data = unflat(data_idx)
            print(f"Message Router Run {i} Output:")
            print(json.dumps(run_data, indent=2))
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
