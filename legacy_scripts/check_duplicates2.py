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

    found = False
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
        found = True
        
        def unflat(idx, depth=0):
            if depth > 20: return idx
            if isinstance(idx, str) and idx.isdigit():
                val = data[int(idx)]
                if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                return val
            return idx
            
        print(f"\n=== EXECUTION {exec_id} ===")
        
        if 'Message Router' in mapping:
            idx = mapping['Message Router']
            runs = data[int(idx)]
            run = data[int(runs[0])]
            if 'data' in run:
                out = unflat(run['data'])
                if 'main' in out and out['main']:
                    for branch_idx, branch in enumerate(out['main']):
                        if branch:
                            items = branch if isinstance(branch, list) else [branch]
                            print(f"Message Router Branch {branch_idx} sent {len(items)} items")

        idx = mapping['Telegram Fanout']
        runs = data[int(idx)]
        run = data[int(runs[0])]
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out and out['main'] and out['main'][0]:
                items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                print(f"Telegram Fanout received {len(items)} items:")
                for i, it in enumerate(items):
                    j = it.get('json', it)
                    chat_id = j.get('chat_id', 'unknown')
                    text = str(j.get('text', ''))[:50].replace('\n', ' ')
                    print(f"  Item {i}: chat_id={chat_id}, text='{text}'")

        if 'Dynamic Routing Engine' in mapping:
            dr_idx = mapping['Dynamic Routing Engine']
            dr_runs = data[int(dr_idx)]
            dr_run = data[int(dr_runs[0])]
            if 'data' in dr_run:
                out = unflat(dr_run['data'])
                if 'main' in out and out['main'] and out['main'][0]:
                    items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
                    print(f"Dynamic Routing Engine returned {len(items)} items:")
                    for i, it in enumerate(items):
                        j = it.get('json', it)
                        routes = j.get('matched_routes', [])
                        print(f"  Item {i}: {len(routes)} matched routes: {[r.get('channel_name') for r in routes]}")
                        
        break

    if not found:
        print("No execution reached Telegram Fanout in the last 100 executions.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
