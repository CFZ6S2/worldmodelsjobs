import sqlite3
import json
import urllib.request

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# 1. Check what's in the DB right now
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row['nodes'])

print("=== CURRENT DB STATE ===")
for node in nodes:
    if node['name'] == 'Extract Metadata WA1':
        code = node['parameters']['jsCode']
        print(f"Extract Metadata WA1 - first 80 chars: {code[:80]}")
        print(f"  Has 'return []': {'return []' in code}")
    if node['name'] == 'Pre-Filter Unified1':
        code = node['parameters']['jsCode']
        print(f"Pre-Filter Unified1 - first 80 chars: {code[:80]}")
        print(f"  Has 'continue': {'continue' in code}")
    if node['name'] == 'Dedup Hash1':
        code = node['parameters']['jsCode']
        print(f"Dedup Hash1 - first 80 chars: {code[:80]}")
conn.close()

# 2. Check last 5 executions to see if they're STILL all going to IA
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("""
    SELECT e.id, e.startedAt, e.stoppedAt, ed.data
    FROM execution_entity e
    JOIN execution_data ed ON e.id = ed.executionId
    WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
    ORDER BY e.id DESC LIMIT 5
""")
print("\n=== LAST 5 EXECUTIONS ===")
for row in c.fetchall():
    data = json.loads(row['data'])
    mapping = None
    for item in data:
        if isinstance(item, dict) and len(item) > 3:
            mapping = item
            break
    nodes_ran = sorted(mapping.keys()) if mapping else []
    has_ia = 'IA Extract1' in nodes_ran
    started = row['startedAt'] or '?'
    stopped = row['stoppedAt'] or '?'
    print(f"  Exec {row['id']}: IA={has_ia} | started={started} | stopped={stopped}")
    print(f"    Nodes: {', '.join(nodes_ran)}")
conn.close()
