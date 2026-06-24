import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 50
    """)

    blocked_pre = []
    blocked_trash = []

    for row in c.fetchall():
        data = row[1]
        
        # Try to extract the raw text
        text = ""
        try:
            d = json.loads(data)
            def unflat(idx, depth=0):
                if depth > 20: return idx
                if isinstance(idx, str) and idx.isdigit():
                    val = d[int(idx)]
                    if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                    if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                    return val
                return idx
            
            mapping = None
            for item in d:
                if isinstance(item, dict) and ('Webhook' in item or 'Telegram Webhook' in item):
                    mapping = item
                    break
            
            if mapping:
                node_name = 'Webhook' if 'Webhook' in mapping else 'Telegram Webhook'
                runs = d[int(mapping[node_name])]
                run = d[int(runs[0])]
                if 'data' in run:
                    out = unflat(run['data'])
                    j = out['main'][0][0].get('json', {})
                    if node_name == 'Webhook':
                        text = j.get('body', {}).get('message', {}).get('extendedTextMessage', {}).get('text') or j.get('body', {}).get('message', {}).get('conversation') or ""
                    else:
                        text = j.get('body', {}).get('message', {}).get('text', '')
        except Exception:
            pass

        if '"Pre-Filter Unified1":' in data and '"Parse JSON1":' not in data:
            blocked_pre.append(text)
        elif '"Final Guard1":' in data and '"Message Router":' not in data:
            blocked_trash.append(text)

    conn.close()
    
    print("\\n=== BLOCKED BY PRE-FILTER (Sample of 10) ===")
    for t in blocked_pre[:10]:
        print(f" - {t[:150]!r}")
        
    print("\\n=== BLOCKED BY AI AS TRASH (Sample of 10) ===")
    for t in blocked_trash[:10]:
        print(f" - {t[:150]!r}")

except Exception as e:
    print(f"Error: {e}")
