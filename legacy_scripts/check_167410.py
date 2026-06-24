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
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ' AND e.id = 167410
    """)

    for row in c.fetchall():
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
            
        pj_runs = d[int(run_data['Parse JSON1'])]
        pj_run = d[int(pj_runs[0])]
        pj_out = unflat(pj_run.get('data', {}))
        
        j = pj_out['main'][0][0]['json']
        print(json.dumps(j, indent=2))

    conn.close()

except Exception as e:
    print(f"Error: {e}")
