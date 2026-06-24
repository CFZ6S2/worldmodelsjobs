import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, status, executionData FROM execution_entity ORDER BY id DESC LIMIT 20")
rows = c.fetchall()

hanging = []
for row in rows:
    exec_id, status, data_str = row
    if status == 'running' or status == 'new':
        last_node = "Unknown"
        if data_str:
            try:
                data = json.loads(data_str)
                if "resultData" in data and "runData" in data["resultData"]:
                    run_data = data["resultData"]["runData"]
                    # Get the node with the most recent execution
                    last_node = list(run_data.keys())[-1] if run_data else "Unknown"
            except:
                pass
        
        hanging.append(f"Exec {exec_id} status: {status}, stuck at node: {last_node}")

conn.close()

if hanging:
    print("Hanging executions found:")
    for h in hanging:
        print(h)
else:
    print("No hanging executions found.")
