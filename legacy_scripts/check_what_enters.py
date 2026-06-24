import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data 
        FROM execution_entity e 
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 5
    """)
    
    for row in c.fetchall():
        exec_id = row['id']
        data = json.loads(row['data'])
        
        mapping = None
        for item in data:
            if isinstance(item, dict) and 'Extract Metadata WA1' in item:
                mapping = item
                break
            elif isinstance(item, dict) and 'Extract Metadata TG1' in item:
                mapping = item
                break
        
        if not mapping:
            continue

        def unflat(idx, depth=0):
            if depth > 20:
                return idx
            if isinstance(idx, str) and idx.isdigit():
                val = data[int(idx)]
                if isinstance(val, dict):
                    return {k: unflat(v, depth+1) for k, v in val.items()}
                if isinstance(val, list):
                    return [unflat(v, depth+1) for v in val]
                return val
            return idx
        
        # Get Extract Metadata output (= Pre-Filter input)
        ext_name = 'Extract Metadata WA1' if 'Extract Metadata WA1' in mapping else 'Extract Metadata TG1'
        ext_idx = mapping[ext_name]
        ext_runs = data[int(ext_idx)]
        run = data[int(ext_runs[0])]
        
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out and out['main'] and out['main'][0]:
                items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                for it in items:
                    j = it.get('json', {})
                    print(f"Exec {exec_id} ({ext_name}):")
                    print(f"  sender/from: {j.get('final_contact', j.get('from', '?'))}")
                    print(f"  texto_limpio: {str(j.get('texto_limpio', ''))[:100]}")
                    print(f"  chat_name: {j.get('chat_name', '?')}")
                    print()
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
