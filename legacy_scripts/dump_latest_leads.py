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
        ORDER BY e.id DESC LIMIT 100
    """)

    count = 0
    for row in c.fetchall():
        data = json.loads(row['data'])
        mapping = None
        for item in data:
            if isinstance(item, dict) and 'Telegram Fanout' in item:
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
            
        if 'Telegram Fanout' in mapping:
            idx = mapping['Telegram Fanout']
            runs = data[int(idx)]
            run = data[int(runs[0])]
            if 'data' in run:
                out = unflat(run['data'])
                if 'main' in out and out['main'] and out['main'][0]:
                    items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                    print(f"\n=== EXECUTION {row['id']} ===")
                    for i, it in enumerate(items):
                        j = it.get('json', it)
                        city = str(j.get('city', ''))
                        text = str(j.get('texto_limpio', ''))
                        print(f"City: {city} | Text: {text[:100]}")
                        break
        count += 1
        if count >= 10:
            break

    conn.close()
except Exception as e:
    print(f"Error: {e}")
