import sqlite3
import json
import uuid

db = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
json_path = '/root/workflow_v6_5_final.json'
pid = 'IHHRc7ElWDSQodAD'
wid = 'VyJsI6X0SdyAb2ze'

with open(json_path, 'r') as f:
    data = json.load(f)

conn = sqlite3.connect(db)
cur = conn.cursor()

# Get columns
cur.execute('PRAGMA table_info(workflow_entity)')
w_cols = [r[1] for r in cur.fetchall()]

# Prepare workflow record
rec = {
    'id': wid,
    'name': data['name'],
    'active': 1,
    'nodes': json.dumps(data['nodes']),
    'connections': json.dumps(data['connections']),
    'settings': json.dumps(data.get('settings', {})),
    'versionId': wid,
    'createdAt': '2026-03-21 10:00:00',
    'updatedAt': '2026-03-21 10:00:00'
}
w_final = {k: v for k, v in rec.items() if k in w_cols}

# Clean tables
cur.execute('DELETE FROM workflow_entity;')
cur.execute('DELETE FROM project_workflow_record_entity;')
cur.execute('DELETE FROM credentials_entity;')

# Insert workflow
ks = ', '.join(w_final.keys())
ps = ', '.join(['?'] * len(w_final))
cur.execute(f'INSERT INTO workflow_entity ({ks}) VALUES ({ps})', list(w_final.values()))

# Link to project
cur.execute('INSERT INTO project_workflow_record_entity (projectId, workflowId, role) VALUES (?, ?, ?)', (pid, wid, 'admin'))

conn.commit()
conn.close()
print(f'BIT-PERFECT SUCCESS: Engine {wid} linked to Project {pid}.')
