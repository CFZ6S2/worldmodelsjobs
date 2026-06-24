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
            
            if 'Extract Metadata WA1' in run_data:
                wa_runs = d[int(run_data['Extract Metadata WA1'])]
                wa_run = d[int(wa_runs[0])]
                if 'error' in wa_run:
                    print(f"Error in Extract Metadata WA1 for {row[0]}:")
                    print(wa_run['error'])
                else:
                    print(f"Extract Metadata WA1 success for {row[0]}")
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
