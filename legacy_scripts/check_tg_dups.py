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

    found = 0
    for row in c.fetchall():
        data = json.loads(row['data'])
        mapping = None
        for item in data:
            if isinstance(item, dict) and 'Telegram Fanout' in item:
                mapping = item
                break
        
        if not mapping:
            continue
            
        exec_id = row['id']
        
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
            for run_idx_ref in runs:
                run = data[int(run_idx_ref)]
                if 'data' in run:
                    out = unflat(run['data'])
                    if 'main' in out and out['main'] and out['main'][0]:
                        items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                        
                        # Count targets
                        targets = {}
                        for i, it in enumerate(items):
                            j = it.get('json', it)
                            chat_id = j.get('tg_chat', j.get('chatId', 'unknown'))
                            if chat_id in targets:
                                targets[chat_id] += 1
                            else:
                                targets[chat_id] = 1
                                
                        duplicates = {k: v for k, v in targets.items() if v > 1 and k != ""}
                        if duplicates:
                            print(f"\n=== EXECUTION {exec_id} ===")
                            print(f"DUPLICATE TARGETS DETECTED in Telegram Fanout!")
                            for k, v in duplicates.items():
                                print(f"  Chat {k} received {v} messages!")
                            
                            # Print the items going to the duplicate chat
                            for i, it in enumerate(items):
                                j = it.get('json', it)
                                chat_id = j.get('tg_chat', j.get('chatId', 'unknown'))
                                if chat_id in duplicates:
                                    print(f"  -> Item {i}: route_lang={j.get('route_lang')}")
        found += 1
        if found >= 5:
            break

    conn.close()
except Exception as e:
    print(f"Error: {e}")
