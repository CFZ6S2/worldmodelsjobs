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
        WHERE e.id = 168913
    """)

    for row in c.fetchall():
        d = json.loads(row[2])
        try:
            res_data = d[int(d[0]["resultData"])]
            run_data = d[int(res_data["runData"])]
            nodes = list(run_data.keys())
            
            def unflat(idx, depth=0):
                if depth > 20: return idx
                if isinstance(idx, str) and idx.isdigit():
                    val = d[int(idx)]
                    if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                    if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                    return val
                return idx
            
            print(f"Execution {row[0]}: Nodes executed: {nodes}")
            
            if 'Parse JSON1' in nodes:
                pj_runs = d[int(run_data['Parse JSON1'])]
                pj_run = d[int(pj_runs[0])]
                pj_out = unflat(pj_run.get('data', {}))
                items = pj_out.get('main', [[]])[0]
                if items:
                    print(f"  -> Parse JSON1 output: {json.dumps(items[0]['json'])}")
            
            if 'Message Router' in nodes:
                mr_runs = d[int(run_data['Message Router'])]
                mr_run = d[int(mr_runs[0])]
                mr_out = unflat(mr_run.get('data', {}))
                items = mr_out.get('main', [[]])[0]
                routes = [i['json'].get('route_lang') for i in items]
                print(f"  -> Message Router sent to routes: {routes}")
                
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
