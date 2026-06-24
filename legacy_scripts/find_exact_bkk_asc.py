import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT executionId, data FROM execution_data WHERE data LIKE '%600$ чистыми%' ORDER BY executionId ASC LIMIT 5")
    rows = c.fetchall()
    
    if not rows:
        print("No executions found with 600$ чистыми")
    else:
        for row in rows:
            print(f"Found execution ID: {row['executionId']}")
            
            data = json.loads(row['data'])
            mapping = None
            for item in data:
                if isinstance(item, dict) and 'Webhook WhatsApp' in item:
                    mapping = item
                    break
            
            if mapping:
                nodes_run = list(mapping.keys())
                print(f"Nodes executed: {', '.join(nodes_run)}")
                
                # Check where it stopped or failed by finding the last node
                last_node = nodes_run[-1]
                print(f"Last node: {last_node}")
            print("---")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
