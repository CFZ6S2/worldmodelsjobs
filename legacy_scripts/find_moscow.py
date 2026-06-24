import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT executionId, data FROM execution_data WHERE data LIKE '%Oferta de trabajo en Moscú: modelo de alto nivel%' ORDER BY executionId DESC LIMIT 2")
    rows = c.fetchall()
    
    if not rows:
        print("No executions found")
    else:
        for row in rows:
            print(f"Execution ID: {row['executionId']}")
            data = json.loads(row['data'])
            
            mapping = None
            for item in data:
                if isinstance(item, dict) and 'Webhook WhatsApp' in item:
                    mapping = item
                    break
                    
            if mapping:
                if 'Extract Metadata WA1' in mapping:
                    idx_str = mapping['Extract Metadata WA1']
                    node_runs_idx = data[int(idx_str)]
                    run_data = data[int(node_runs_idx[0])]
                    print("Extract Metadata WA1 category:", end=" ")
                    
                    def unflat(idx):
                        if not isinstance(idx, str) or not idx.isdigit():
                            return idx
                        val = data[int(idx)]
                        if isinstance(val, dict):
                            return {k: unflat(v) for k, v in val.items()}
                        if isinstance(val, list):
                            return [unflat(v) for v in val]
                        return val
                        
                    try:
                        out = unflat(run_data['data'])
                        if 'main' in out and len(out['main']) > 0 and len(out['main'][0]) > 0:
                            print(out['main'][0][0]['json'].get('category'))
                    except Exception as e:
                        print("Error extracting category", e)
            print("---")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
