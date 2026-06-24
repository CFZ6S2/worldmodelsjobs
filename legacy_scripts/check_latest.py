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
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 20
    """)

    for row in c.fetchall():
        try:
            d = json.loads(row[1])
            root = d[0]
            if "resultData" not in root: continue
            
            res_data = d[int(root["resultData"])]
            if "runData" not in res_data: continue
            
            run_data = d[int(res_data["runData"])]
            nodes = list(run_data.keys())
            
            if 'Parse JSON1' in nodes:
                print(f"Execution {row[0]}: Nodes: {nodes}")
                
        except Exception as e:
            pass

    conn.close()

except Exception as e:
    print(f"Error: {e}")
