import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.id = 169863
    """)

    row = c.fetchone()
    d = json.loads(row[1])
    res_data = d[int(d[0]["resultData"])]
    run_data = d[int(res_data["runData"])]
    
    def unflat(idx, depth=0):
        if depth > 20: return idx
        if isinstance(idx, str) and idx.isdigit():
            val = d[int(idx)]
            if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
            if isinstance(val, list): return [unflat(v, depth+1) for v in val]
            return val
        return idx

    if 'Extract Metadata WA1' in run_data:
        wa_runs = d[int(run_data['Extract Metadata WA1'])]
        wa_run = d[int(wa_runs[0])]
        wa_out = unflat(wa_run.get('data', {}))
        print(f"Extract WA Payload for 169863: {json.dumps(wa_out, indent=2)}")
        if 'error' in wa_run:
            print(f"Extract WA ERROR: {wa_run['error']}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
