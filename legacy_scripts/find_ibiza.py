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
        ORDER BY e.id DESC LIMIT 300
    """)

    ibiza_count = 0
    passed_ibiza = 0

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
            
            is_ibiza = False
            
            if 'Parse JSON1' in nodes:
                pj_runs = d[int(run_data['Parse JSON1'])]
                pj_run = d[int(pj_runs[0])]
                pj_out = unflat(pj_run.get('data', {}))
                
                try:
                    j = pj_out['main'][0][0]['json']
                    city = j.get('city', '').lower()
                    text = j.get('text_es', '').lower()
                    if 'ibiza' in city or 'eivissa' in city or 'ibiza' in text or 'eivissa' in text:
                        is_ibiza = True
                        ibiza_count += 1
                        
                        if 'Dynamic Routing Engine' in nodes:
                            passed_ibiza += 1
                            print(f"Execution {row[0]} at {row[1]}: IBIZA passed DRE")
                        elif 'Message Router' in nodes:
                            passed_ibiza += 1
                            print(f"Execution {row[0]} at {row[1]}: IBIZA passed MR")
                        else:
                            print(f"Execution {row[0]} at {row[1]}: IBIZA blocked by {nodes[-1]}")
                except Exception as e: pass

        except Exception as e:
            pass

    conn.close()
    
    print(f"Total Ibiza found: {ibiza_count}")
    print(f"Total Ibiza passed: {passed_ibiza}")

except Exception as e:
    print(f"Error: {e}")
