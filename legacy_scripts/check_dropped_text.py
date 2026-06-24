import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Look back about 200 executions
    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 200
    """)

    for row in c.fetchall():
        d = json.loads(row[1])
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

            if 'Webhook WhatsApp' in run_data:
                wa_runs = d[int(run_data['Webhook WhatsApp'])]
                wa_run = d[int(wa_runs[0])]
                wa_out = unflat(wa_run.get('data', {}))
                
                # Check what Extract Metadata WA1 did
                if 'Extract Metadata WA1' in run_data:
                    ext_runs = d[int(run_data['Extract Metadata WA1'])]
                    ext_run = d[int(ext_runs[0])]
                    ext_out = unflat(ext_run.get('data', {}))
                    ext_items = ext_out.get('main', [[]])[0]
                    
                    if len(ext_items) == 0:
                        # Extract returned empty. Check the payload to see if it WAS text.
                        payload = wa_out.get('main', [[]])[0][0].get('json', {})
                        body = payload.get('body', {})
                        msgs = body.get('messages', [])
                        if len(msgs) > 0:
                            msg = msgs[0]
                            if msg.get('type') == 'text':
                                print(f"WARNING! Exec {row[0]} was a TEXT message but returned EMPTY!")
                                print(json.dumps(msg, indent=2))
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
