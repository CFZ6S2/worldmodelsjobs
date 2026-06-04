#!/usr/bin/env python3
import sqlite3, json, sys

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
WF_ID = 'A0QpoDzX559wzRXQ'

conn = sqlite3.connect(DB)
cur = conn.cursor()

# List all workflows
cur.execute('SELECT id, name, active FROM workflow_entity')
print("=== ALL WORKFLOWS ===")
for r in cur.fetchall():
    print(f"ID: {r[0]} | Name: {r[1]} | Active: {r[2]}")

# Get the target workflow nodes
print(f"\n=== NODES FOR {WF_ID} ===")
cur.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (WF_ID,))
row = cur.fetchone()
if row:
    nodes = json.loads(row[0])
    for n in nodes:
        ntype = n.get('type', '?')
        name = n.get('name', '?')
        params = n.get('parameters', {})
        # Show model info for LLM nodes
        model = params.get('model', '')
        creds = n.get('credentials', {})
        print(f"  [{ntype}] {name}" + (f" model={model}" if model else "") + (f" creds={json.dumps(creds)}" if creds else ""))
else:
    print("NOT FOUND")

# Get connections
print(f"\n=== CONNECTIONS FOR {WF_ID} ===")
cur.execute('SELECT connections FROM workflow_entity WHERE id = ?', (WF_ID,))
row = cur.fetchone()
if row:
    conns = json.loads(row[0])
    for src, outputs in conns.items():
        for output_type, targets_list in outputs.items():
            for targets in targets_list:
                for t in targets:
                    print(f"  {src} --[{output_type}]--> {t['node']}")

conn.close()
