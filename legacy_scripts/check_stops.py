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
        ORDER BY e.id DESC LIMIT 10
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
                wa_run = d[int(d[int(run_data['Extract Metadata WA1'])][0])]
                wa_out = unflat(wa_run.get('data', {}))
                print(f"WA Extract out for {row[0]}: {json.dumps(wa_out, indent=2)}")
            if 'Extract Metadata TG1' in nodes:
                tg_run = d[int(d[int(run_data['Extract Metadata TG1'])][0])]
                tg_out = unflat(tg_run.get('data', {}))
                print(f"TG Extract out for {row[0]}: {json.dumps(tg_out, indent=2)}")
            if 'Pre-Filter Unified1' in nodes:
                pf_run = d[int(d[int(run_data['Pre-Filter Unified1'])][0])]
                pf_out = unflat(pf_run.get('data', {}))
                print(f"Pre-Filter out for {row[0]}: {json.dumps(pf_out, indent=2)}")

        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
