import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.id = 165728
    """)

    for row in c.fetchall():
        d = json.loads(row[2])
        try:
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
                
            w_runs = d[int(run_data['Dynamic WhatsApp Alert'])]
            w_run = d[int(w_runs[0])]
            w_out = unflat(w_run.get('data', {}))
            print("Execution 165728 Dynamic WhatsApp Alert Payload:")
            print(json.dumps(w_out['main'][0], indent=2))
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
