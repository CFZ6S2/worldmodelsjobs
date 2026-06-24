import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("""
    SELECT e.id, ed.data
    FROM execution_entity e
    JOIN execution_data ed ON e.id = ed.executionId
    WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
    ORDER BY e.id DESC LIMIT 10
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
        continue
    
    def unflat(idx, depth=0):
        if depth > 20: return idx
        if isinstance(idx, str) and idx.isdigit():
            val = data[int(idx)]
            if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
            if isinstance(val, list): return [unflat(v, depth+1) for v in val]
            return val
        return idx

    source = 'Webhook WhatsApp' if 'Webhook WhatsApp' in mapping else 'Webhook Telegram'
    wh_idx = mapping[source]
    wh_runs = data[int(wh_idx)]
    run = data[int(wh_runs[0])]
    
    if 'data' in run:
        out = unflat(run['data'])
        if 'main' in out and out['main'] and out['main'][0]:
            items = out['main'][0] if isinstance(out['main'][0], list) else [out['main'][0]]
            j = items[0].get('json', {})
            body = j.get('body', j)
            text = body.get('text', '') if isinstance(body, dict) else str(body)
            if isinstance(text, dict):
                text = text.get('text', str(text))
            text = str(text)[:120]
            sender = body.get('from', j.get('from', '?')) if isinstance(body, dict) else j.get('from', '?')
            msg_type = body.get('type', j.get('type', '?')) if isinstance(body, dict) else j.get('type', '?')
            
            # Check which nodes ran
            nodes_ran = sorted(mapping.keys())
            has_extract = 'Extract Metadata WA1' in nodes_ran or 'Extract Metadata TG1' in nodes_ran
            has_prefilter = 'Pre-Filter Unified1' in nodes_ran
            has_ia = 'IA Extract1' in nodes_ran
            
            died_at = "WEBHOOK ONLY"
            if has_extract and not has_prefilter: died_at = "EXTRACT METADATA (killed)"
            elif has_prefilter and not has_ia: died_at = "PRE-FILTER (killed)"
            elif has_ia: died_at = "PASSED TO IA"
            
            print(f"Exec {exec_id} [{source}]: died_at={died_at}")
            print(f"  type={msg_type} sender={sender}")
            print(f"  text: {text}")
            print()

conn.close()
