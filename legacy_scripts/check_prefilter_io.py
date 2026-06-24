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
            if isinstance(item, dict) and 'Pre-Filter Unified1' in item:
                mapping = item
                break
        
        if not mapping:
            continue

        def unflat(idx, depth=0):
            if depth > 15:
                return idx
            if not isinstance(idx, str) or not idx.isdigit():
                return idx
            val = data[int(idx)]
            if isinstance(val, dict):
                return {k: unflat(v, depth+1) for k, v in val.items()}
            if isinstance(val, list):
                return [unflat(v, depth+1) for v in val]
            return val
        
        # Get Pre-Filter input (what it received)
        pf_idx = mapping['Pre-Filter Unified1']
        pf_runs = data[int(pf_idx)]
        run = data[int(pf_runs[0])]
        
        # Get the input data
        if 'inputData' in run:
            inp = unflat(run['inputData'])
            if 'main' in inp and inp['main'] and inp['main'][0]:
                first = inp['main'][0][0] if isinstance(inp['main'][0], list) else inp['main'][0]
                j = first.get('json', {})
                sender = j.get('final_contact', j.get('from', '?'))
                text = str(j.get('texto_limpio', ''))[:80]
                print(f"Exec {exec_id}: sender={sender} text={text}")
        
        # Get Pre-Filter output
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out and out['main']:
                output_items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                print(f"  -> PreFilter OUTPUT: {len(output_items)} items passed through")
            else:
                print(f"  -> PreFilter OUTPUT: EMPTY (blocked)")
        print()
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
