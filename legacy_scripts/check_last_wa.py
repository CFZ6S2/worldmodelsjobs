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
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 200
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
            
            if 'Extract Metadata WA1' in nodes:
                wa_runs = d[int(run_data['Extract Metadata WA1'])]
                wa_run = d[int(wa_runs[0])]
                wa_out = unflat(wa_run.get('data', {}))
                items = wa_out.get('main', [[]])[0]
                if items:
                    print(f"Execution {row[0]}: Extract Metadata WA1 output sender_contact: {items[0]['json'].get('sender_contact')}")
                    
                if 'Parse JSON1' in nodes:
                    pj_runs = d[int(run_data['Parse JSON1'])]
                    pj_run = d[int(pj_runs[0])]
                    pj_out = unflat(pj_run.get('data', {}))
                    p_items = pj_out.get('main', [[]])[0]
                    if p_items:
                        print(f"  -> Parse JSON1 output contact: {p_items[0]['json'].get('contact')}")
                    break
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
