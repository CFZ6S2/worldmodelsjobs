import sqlite3
import json
import sys

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # In n8n v1.x, execution data is in execution_data table
    # execution_entity has id, status, workflowId, waitTill, etc.
    c.execute("""
        SELECT e.id, e.status, d.data 
        FROM execution_entity e
        LEFT JOIN execution_data d ON e.id = d.executionId
        ORDER BY e.id DESC 
        LIMIT 5
    """)
    
    rows = c.fetchall()
    
    for row in rows:
        exec_id = row['id']
        status = row['status']
        print(f"\n=== Execution {exec_id} | Status: {status} ===")
        
        data_str = row['data']
        if data_str:
            data = json.loads(data_str)
            if "resultData" in data and "error" in data["resultData"]:
                print("ERROR:", data["resultData"]["error"].get("message"))
            if "resultData" in data and "runData" in data["resultData"]:
                run_data = data["resultData"]["runData"]
                # Print the last executed node
                if run_data:
                    last_node = list(run_data.keys())[-1]
                    print(f"Last executed node: {last_node}")
                    
                    # Print error in the last node if any
                    last_node_runs = run_data[last_node]
                    for run in last_node_runs:
                        if "error" in run:
                            print(f"Node Error: {run['error'].get('message')}")
        else:
            print("No execution data available.")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
