import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 500")
    rows = c.fetchall()
    
    for row in rows:
        data_str = row['data']
        if 'San Petersburgo' in data_str or 'Санкт-Петербург' in data_str:
            print(f"\n--- Found in execution {row['executionId']} ---")
            
            data = json.loads(data_str)
            def unflat(idx):
                if not isinstance(idx, str) or not idx.isdigit():
                    return idx
                val = data[int(idx)]
                if isinstance(val, dict):
                    return {k: unflat(v) for k, v in val.items()}
                if isinstance(val, list):
                    return [unflat(v) for v in val]
                return val

            # Check inputs to DRE
            dre_idx = None
            for i, item in enumerate(data):
                if isinstance(item, dict) and 'Dynamic Routing Engine' in item:
                    dre_idx = item['Dynamic Routing Engine']
                    break
            
            if dre_idx is not None:
                dre_out = unflat(dre_idx)
                print("DRE Output:")
                print(json.dumps(dre_out, indent=2))
            else:
                print("DRE not found in this execution!")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
