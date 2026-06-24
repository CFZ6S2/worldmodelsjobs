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
            
            if 'Parse JSON1' in nodes:
                pj_runs = d[int(run_data['Parse JSON1'])]
                pj_run = d[int(pj_runs[0])]
                pj_out = unflat(pj_run.get('data', {}))
                items = pj_out.get('main', [[]])[0]
                if items:
                    text_es = items[0]['json'].get('text_es', '').lower()
                    city = items[0]['json'].get('city', '').lower()
                    if 'moscu' in text_es or 'moscow' in text_es or 'москва' in text_es or 'moscu' in city or 'moscow' in city or 'москва' in city:
                        print(f"Moscow execution found: {row[0]} at {row[1]}")
                        
                        if 'Message Router' in nodes:
                            mr_runs = d[int(run_data['Message Router'])]
                            mr_run = d[int(mr_runs[0])]
                            mr_out = unflat(mr_run.get('data', {}))
                            mr_items = mr_out.get('main', [[]])[0]
                            routes = [i['json'].get('route_lang') for i in mr_items]
                            print(f"  -> Message Router sent to routes: {routes}")
                            
                            if 'Telegram Fanout' in nodes:
                                tf_runs = d[int(run_data['Telegram Fanout'])]
                                tf_run = d[int(tf_runs[0])]
                                tf_out = unflat(tf_run.get('data', {}))
                                tf_items = tf_out.get('main', [[]])[0]
                                if tf_items and 'error' in tf_items[0].get('json', {}):
                                    print(f"  -> Telegram Fanout ERROR: {tf_items[0]['json']['error']}")
                                else:
                                    print(f"  -> Telegram Fanout SUCCESS")
                            else:
                                print("  -> Telegram Fanout NOT EXECUTED")
                        else:
                            print(f"  -> Message Router NOT EXECUTED (Blocked by {nodes[-1]})")

        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
