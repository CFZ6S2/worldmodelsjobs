import sqlite3
import json
from datetime import datetime

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Search executions from the last 5 hours
    c.execute("""
        SELECT e.id, e.startedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ' AND e.startedAt > datetime('now', '-5 hours')
        ORDER BY e.id DESC
    """)

    ibiza_count = 0

    for row in c.fetchall():
        d = json.loads(row[2])
        try:
            res_data = d[int(d[0]["resultData"])]
            run_data = d[int(res_data["runData"])]
            nodes = list(run_data.keys())
            
            def unflat(idx, depth=0):
                if depth > 20: return idx
                if isinstance(idx, str) and idx.isdigit():
                    val = d[int(idx)]
                    if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                    if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                    return val
                return idx
            
            if 'Webhook' in nodes or 'Webhook WhatsApp' in nodes or 'Telegram Webhook' in nodes:
                w_node = 'Webhook' if 'Webhook' in nodes else ('Webhook WhatsApp' if 'Webhook WhatsApp' in nodes else 'Telegram Webhook')
                w_runs = d[int(run_data[w_node])]
                w_run = d[int(w_runs[0])]
                w_out = unflat(w_run.get('data', {}))
                
                raw_str = json.dumps(w_out).lower()
                if 'ibiza' in raw_str or 'eivissa' in raw_str:
                    ibiza_count += 1
                    print(f"Ibiza lead at {row[1]} UTC (Execution {row[0]})")

        except Exception as e:
            pass

    conn.close()
    
    print(f"Total Ibiza leads found in raw webhooks since 18:00: {ibiza_count}")

except Exception as e:
    print(f"Error: {e}")
