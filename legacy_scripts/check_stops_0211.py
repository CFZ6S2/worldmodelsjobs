import sqlite3
import json
from datetime import datetime, timezone

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, e.stoppedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 20
    """)

    for row in c.fetchall():
        d = json.loads(row[3])
        try:
            res_data = d[int(d[0]["resultData"])]
            run_data = d[int(res_data["runData"])]
            nodes = list(run_data.keys())
            
            print(f"Exec {row[0]} | Started: {row[1]} | Nodes: {nodes}")
            
            def unflat(idx, depth=0):
                if depth > 20: return idx
                if isinstance(idx, str) and idx.isdigit():
                    val = d[int(idx)]
                    if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                    if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                    return val
                return idx

            if 'Extract Metadata WA1' in run_data:
                wa_run = d[int(d[int(run_data['Extract Metadata WA1'])][0])]
                if 'error' in wa_run:
                    print(f"  WA Extract ERROR: {wa_run['error']}")
                else:
                    wa_out = unflat(wa_run.get('data', {}))
                    main_out = wa_out.get('main', [[]])[0]
                    print(f"  WA Extract Items: {len(main_out)}")
                    if len(main_out) > 0:
                        print(f"  WA Extract Sample: {json.dumps(main_out[0].get('json', {}), indent=2)}")

            if 'Extract Metadata TG1' in run_data:
                tg_run = d[int(d[int(run_data['Extract Metadata TG1'])][0])]
                if 'error' in tg_run:
                    print(f"  TG Extract ERROR: {tg_run['error']}")
                else:
                    tg_out = unflat(tg_run.get('data', {}))
                    main_out = tg_out.get('main', [[]])[0]
                    print(f"  TG Extract Items: {len(main_out)}")
                    
            if 'Pre-Filter Unified1' in run_data:
                pf_run = d[int(d[int(run_data['Pre-Filter Unified1'])][0])]
                pf_out = unflat(pf_run.get('data', {}))
                main_out = pf_out.get('main', [[]])[0]
                print(f"  Pre-Filter Items: {len(main_out)}")
                if len(main_out) == 0:
                    print("  -> Dropped at Pre-Filter!")
                    
            if 'Dedup Hash1' in run_data:
                dedup_run = d[int(d[int(run_data['Dedup Hash1'])][0])]
                dedup_out = unflat(dedup_run.get('data', {}))
                main_out = dedup_out.get('main', [[]])[0]
                print(f"  Dedup Items: {len(main_out)}")
                if len(main_out) == 0:
                    print("  -> Dropped at Dedup!")
                    
            if 'IA Extract1' in run_data:
                ia_run = d[int(d[int(run_data['IA Extract1'])][0])]
                ia_out = unflat(ia_run.get('data', {}))
                main_out = ia_out.get('main', [[]])[0]
                print(f"  IA Items: {len(main_out)}")

            if 'Dynamic WhatsApp Alert' in run_data:
                dwa_run = d[int(d[int(run_data['Dynamic WhatsApp Alert'])][0])]
                if 'error' in dwa_run:
                    print(f"  DWA ERROR: {dwa_run['error']}")
                else:
                    print(f"  DWA SUCCESS")

        except Exception as e:
            pass
        print("-" * 40)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
