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
            
            if 'Parse JSON1' in nodes:
                pj_runs = d[int(run_data['Parse JSON1'])]
                pj_out = d[int(d[int(pj_runs[0])].get('data', {}))] # wait, unflat logic needed.
                print(f"Execution {row[0]} at {row[1]}: Passed Parse JSON1")
                if 'Final Guard1' in nodes and 'Message Router' not in nodes and 'Dynamic Routing Engine' not in nodes:
                    print(f"  -> Blocked by Final Guard")
                elif 'Message Router' in nodes or 'Dynamic Routing Engine' in nodes:
                    print(f"  -> SENT SUCCESSFULLY")
        except:
            pass

    conn.close()

except Exception as e:
    print(f"Error: {e}")
