import sqlite3
import json
import uuid
import sys

db = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
json_path = '/root/workflow_v6_5_final.json' # Aligned with worldmodelsjobs-lead

with open(json_path, 'r') as f:
    data = json.load(f)

conn = sqlite3.connect(db)
cur = conn.cursor()

# Get columns
cur.execute('PRAGMA table_info(workflow_entity)')
cols = [r[1] for r in cur.fetchall()]

# Prepare record
uid = str(uuid.uuid4())
rec = {
    'id': uid,
    'name': data['name'],
    'active': 1,
    'nodes': json.dumps(data['nodes']),
    'connections': json.dumps(data['connections']),
    'settings': json.dumps(data.get('settings', {})),
    'versionId': uid,
    'createdAt': '2026-03-21 10:00:00',
    'updatedAt': '2026-03-21 10:00:00'
}

final_rec = {k: v for k, v in rec.items() if k in cols}

cur.execute('DELETE FROM workflow_entity;')
ks = ', '.join(final_rec.keys())
ps = ', '.join(['?'] * len(final_rec))
cur.execute(f'INSERT INTO workflow_entity ({ks}) VALUES ({ps})', list(final_rec.values()))

conn.commit()
conn.close()
print(f'RESTORED SUCCESS: Aligned Engine {uid} injected.')
