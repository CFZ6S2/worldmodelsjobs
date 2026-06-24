import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Get last 3 executions that DID go to IA
c.execute("""
    SELECT e.id, e.startedAt, e.stoppedAt, ed.data
    FROM execution_entity e
    JOIN execution_data ed ON e.id = ed.executionId
    WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
    ORDER BY e.id DESC LIMIT 3
""")

for row in c.fetchall():
    exec_id = row['id']
    data = json.loads(row['data'])
    
    mapping = None
    for item in data:
        if isinstance(item, dict) and ('Webhook WhatsApp' in item or 'Webhook Telegram' in item):
            mapping = item
            break
    
    if not mapping:
        print(f"Exec {exec_id}: no mapping found (keys in data items: {[list(i.keys())[:3] if isinstance(i, dict) else type(i).__name__ for i in data[:5]]})")
        continue
    
    nodes_list = sorted(mapping.keys())
    has_ia = 'IA Extract1' in nodes_list
    
    def unflat(idx, depth=0):
        if depth > 20: return idx
        if isinstance(idx, str) and idx.isdigit():
            val = data[int(idx)]
            if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
            if isinstance(val, list): return [unflat(v, depth+1) for v in val]
            return val
        return idx
    
    print(f"\nExec {exec_id}: IA={has_ia} | started={row['startedAt']} | stopped={row['stoppedAt']}")
    print(f"  Nodes: {', '.join(nodes_list)}")
    
    # Check Extract Metadata output
    ext_name = 'Extract Metadata WA1' if 'Extract Metadata WA1' in mapping else 'Extract Metadata TG1' if 'Extract Metadata TG1' in mapping else None
    if ext_name and ext_name in mapping:
        ext_idx = mapping[ext_name]
        ext_runs = data[int(ext_idx)]
        run = data[int(ext_runs[0])]
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out:
                main = out['main']
                if main and main[0]:
                    items = main[0] if isinstance(main[0], list) else [main[0]]
                    print(f"  {ext_name} OUTPUT: {len(items)} items")
                    for it in items[:1]:
                        j = it.get('json', {})
                        print(f"    texto_limpio: {str(j.get('texto_limpio', ''))[:100]}")
                        print(f"    final_contact: {j.get('final_contact', '?')}")
                        print(f"    platform: {j.get('platform', '?')}")
                else:
                    print(f"  {ext_name} OUTPUT: EMPTY (blocked)")
    
    # Check Pre-Filter output
    if 'Pre-Filter Unified1' in mapping:
        pf_idx = mapping['Pre-Filter Unified1']
        pf_runs = data[int(pf_idx)]
        run = data[int(pf_runs[0])]
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out:
                main = out['main']
                if main and main[0]:
                    items = main[0] if isinstance(main[0], list) else [main[0]]
                    print(f"  Pre-Filter OUTPUT: {len(items)} items passed")
                else:
                    print(f"  Pre-Filter OUTPUT: EMPTY (blocked)")

conn.close()
