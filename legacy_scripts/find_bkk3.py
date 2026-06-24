import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT executionId, data FROM execution_data WHERE data LIKE '%БАНГКОК%' AND data LIKE '%Требуется привлекательная%' ORDER BY executionId DESC LIMIT 5")
    rows = c.fetchall()
    
    if not rows:
        print("No executions found with БАНГКОК + Требуется")
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
                
                # Dump output of the last node
                idx_str = mapping[last_node]
                node_runs_idx = data[int(idx_str)]
                
                def unflat(idx):
                    if not isinstance(idx, str) or not idx.isdigit():
                        return idx
                    val = data[int(idx)]
                    if isinstance(val, dict):
                        return {k: unflat(v) for k, v in val.items()}
                    if isinstance(val, list):
                        return [unflat(v) for v in val]
                    return val
                
                for i, run_idx_str in enumerate(node_runs_idx):
                    run = data[int(run_idx_str)]
                    if 'error' in run:
                        print(f"Error in {last_node}: {run['error']}")
                    else:
                        run_data = unflat(run['data'])
                        print(f"{last_node} output {i}: {json.dumps(run_data, indent=2)}")
            print("---")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
