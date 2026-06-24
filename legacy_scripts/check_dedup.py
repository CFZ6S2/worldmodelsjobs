import sqlite3
import json
import sys

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.id = 165733
    """)

    row = c.fetchone()
    data = json.loads(row['data'])
    
    mapping = None
    for item in data:
        if isinstance(item, dict) and 'Dedup Hash1' in item:
            mapping = item
            break
            
    def unflat(idx, depth=0):
        if depth > 20: return idx
        if isinstance(idx, str) and idx.isdigit():
            val = data[int(idx)]
            if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
            if isinstance(val, list): return [unflat(v, depth+1) for v in val]
            return val
        return idx

    if 'Dedup Hash1' in mapping:
        idx = mapping['Dedup Hash1']
        runs = data[int(idx)]
        run = data[int(runs[0])]
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out and out['main'] and out['main'][0]:
                items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                print("\n--- Dedup Hash1 OUTPUT ---")
                for it in items[:1]:
                    print(json.dumps(it, indent=2, ensure_ascii=False)[:1000])

    conn.close()
except Exception as e:
    print(f"Error: {e}")
