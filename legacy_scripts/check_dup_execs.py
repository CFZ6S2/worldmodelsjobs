import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 50
    """)

    seen = {}
    
    for row in c.fetchall():
        data = json.loads(row['data'])
        mapping = None
        for item in data:
            if isinstance(item, dict) and ('Webhook WhatsApp' in item or 'Webhook Telegram' in item):
                mapping = item
                break
        
        if not mapping:
            continue
            
        def unflat(idx, depth=0):
            if depth > 20: return idx
            if isinstance(idx, str) and idx.isdigit():
                val = data[int(idx)]
                if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                return val
            return idx

        ext_node = 'Extract Metadata WA1' if 'Extract Metadata WA1' in mapping else 'Extract Metadata TG1' if 'Extract Metadata TG1' in mapping else None
        
        if ext_node and ext_node in mapping:
            idx = mapping[ext_node]
            runs = data[int(idx)]
            run = data[int(runs[0])]
            if 'data' in run:
                out = unflat(run['data'])
                if 'main' in out and out['main'] and out['main'][0]:
                    items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                    for it in items[:1]:
                        j = it.get('json', it)
                        text = str(j.get('texto_limpio', ''))
                        if len(text) > 10:
                            short_text = text[:50].replace('\n', ' ')
                            if text in seen:
                                print(f"DUPLICATE FOUND: Exec {row['id']} at {row['startedAt']} AND Exec {seen[text]['id']} at {seen[text]['startedAt']}")
                                print(f"  Text: {short_text}")
                            seen[text] = {'id': row['id'], 'startedAt': row['startedAt']}

    conn.close()
except Exception as e:
    print(f"Error: {e}")
