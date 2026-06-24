import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.id IN (170064, 170047, 170021, 170006, 169968, 169960)
    """)

    for row in c.fetchall():
        d = json.loads(row[1])
        try:
            res_data = d[int(d[0]["resultData"])]
            run_data = d[int(res_data["runData"])]
            if 'Dynamic WhatsApp Alert' in run_data:
                dwa_run = d[int(d[int(run_data['Dynamic WhatsApp Alert'])][0])]
                if 'error' in dwa_run:
                    print(f"Exec {row[0]} DWA Error: {dwa_run['error']}")
                else:
                    print(f"Exec {row[0]} DWA Success!")
        except Exception as e:
            pass
    conn.close()
except Exception as e:
    print(f"Error: {e}")
