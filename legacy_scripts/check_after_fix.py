import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Get executions AFTER 18:02 (when import + restart happened)
c.execute("""
    SELECT e.id, e.startedAt, e.stoppedAt, ed.data
    FROM execution_entity e
    JOIN execution_data ed ON e.id = ed.executionId
    WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
    AND e.startedAt > '2026-06-23 18:02:00'
    ORDER BY e.id DESC LIMIT 15
""")

total = 0
ia_count = 0
killed_count = 0

for row in c.fetchall():
    total += 1
    exec_id = row['id']
    data = json.loads(row['data'])
    
    mapping = None
    for item in data:
        if isinstance(item, dict) and ('Webhook WhatsApp' in item or 'Webhook Telegram' in item or 'Extract Metadata WA1' in item):
            mapping = item
            break
    
    nodes_list = sorted(mapping.keys()) if mapping else []
    has_ia = 'IA Extract1' in nodes_list
    
    if has_ia:
        ia_count += 1
    else:
        killed_count += 1
    
    started = row['startedAt'] or '?'
    stopped = row['stoppedAt'] or '?'
    
    # Calculate duration
    duration = "?"
    try:
        from datetime import datetime
        s = datetime.strptime(started[:26], '%Y-%m-%d %H:%M:%S.%f')
        e = datetime.strptime(stopped[:26], '%Y-%m-%d %H:%M:%S.%f')
        duration = f"{(e-s).total_seconds():.1f}s"
    except:
        pass
    
    marker = "✅ IA" if has_ia else "🚫 KILLED"
    print(f"  {marker} Exec {exec_id}: {duration} | {started}")

print(f"\nAfter fix: {total} executions, {ia_count} to IA, {killed_count} KILLED before IA")
conn.close()
