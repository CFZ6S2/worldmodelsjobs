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
        WHERE e.id = 166710
    """)

    for row in c.fetchall():
        d = json.loads(row[2])
        try:
            res_data = d[int(d[0]["resultData"])]
            run_data = d[int(res_data["runData"])]
            nodes = list(run_data.keys())
            print(f"Execution {row[0]}: Nodes executed: {nodes}")
            
            def unflat(idx, depth=0):
                if depth > 20: return idx
                if isinstance(idx, str) and idx.isdigit():
                    val = d[int(idx)]
                    if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                    if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                    return val
                return idx
            
            if 'Dynamic Routing Engine' in nodes:
                dre_runs = d[int(run_data['Dynamic Routing Engine'])]
                dre_run = d[int(dre_runs[0])]
                dre_out = unflat(dre_run.get('data', {}))
                items = dre_out.get('main', [[]])[0]
                print(f"DRE Output items: {len(items)}")
                for i in items:
                    print(f" -> {i['json']['target_wa']}")
            else:
                print("DRE NOT EXECUTED")
                if 'Pre-Filter Unified1' in nodes:
                    pre_runs = d[int(run_data['Pre-Filter Unified1'])]
                    pre_run = d[int(pre_runs[0])]
                    pre_out = unflat(pre_run.get('data', {}))
                    if not pre_out.get('main', [[]])[0]:
                        print("BLOCKED BY PRE-FILTER")
                if 'Dedup Hash1' in nodes:
                    dedup = d[int(run_data['Dedup Hash1'])]
                    if not unflat(d[int(dedup[0])].get('data', {})).get('main', [[]])[0]:
                        print("BLOCKED BY DEDUP")
                if 'Final Guard1' in nodes:
                    fg = d[int(run_data['Final Guard1'])]
                    if not unflat(d[int(fg[0])].get('data', {})).get('main', [[]])[0]:
                        print("BLOCKED BY FINAL GUARD")
        except Exception as e:
            pass

    conn.close()

except Exception as e:
    print(f"Error: {e}")
