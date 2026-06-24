import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, executionId, data FROM execution_data WHERE data LIKE '%БАНГКОК%' ORDER BY id DESC LIMIT 5")
    rows = c.fetchall()
    
    if not rows:
        print("No executions found with БАНГКОК")
    else:
        for row in rows:
            print(f"Found execution ID: {row['executionId']}")
            
            # Print the path/nodes that executed
            data = json.loads(row['data'])
            if 'resultData' in data and 'runData' in data['resultData']:
                nodes_run = list(data['resultData']['runData'].keys())
                print(f"Nodes executed: {', '.join(nodes_run)}")
                
                # Check where it stopped or failed
                if 'error' in data['resultData']:
                    print(f"Error in execution: {data['resultData']['error']}")
            print("---")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
