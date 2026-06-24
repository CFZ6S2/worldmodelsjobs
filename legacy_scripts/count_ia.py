import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("""
    SELECT e.id, e.startedAt, e.stoppedAt, ed.data
    FROM execution_entity e
    JOIN execution_data ed ON e.id = ed.executionId
    WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
    ORDER BY e.id DESC LIMIT 20
""")

total = 0
ia_count = 0
no_ia_count = 0

for row in c.fetchall():
    total += 1
    data = json.loads(row['data'])
    mapping = None
    for item in data:
        if isinstance(item, dict) and len(item) > 4:
            mapping = item
            break
    
    nodes_ran = sorted(mapping.keys()) if mapping else []
    has_ia = 'IA Extract1' in nodes_ran
    
    if has_ia:
        ia_count += 1
        print(f"  IA  Exec {row['id']}: {row['startedAt']} -> {row['stoppedAt']}")
    else:
        no_ia_count += 1

print(f"\nLast {total} executions: {ia_count} went to IA, {no_ia_count} BLOCKED before IA")
conn.close()
