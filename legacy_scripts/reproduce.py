import sqlite3
import json
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT d.data 
        FROM execution_entity e
        LEFT JOIN execution_data d ON e.id = d.executionId
        WHERE e.id = 137158
    """)
    
    row = c.fetchone()
    if row and row['data']:
        data = json.loads(row['data'])
        if "resultData" in data and "runData" in data["resultData"]:
            run_data = data["resultData"]["runData"]
            if "Parse JSON1" in run_data:
                leadData = run_data["Parse JSON1"][0]["data"]["main"][0][0]["json"]
                print("Extracted leadData:")
                print(json.dumps(leadData, indent=2))
            else:
                print("Parse JSON1 not in runData")
    else:
        print("Execution data not found for 137158")
        
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
