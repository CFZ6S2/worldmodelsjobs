import sqlite3
import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

result = subprocess.run(['sqlite3', DB, "SELECT rowid, nodes FROM workflow_entity;"], capture_output=True, text=True)
lines = result.stdout.strip().split('\n')
for line in lines:
    if not line.strip(): continue
    parts = line.split('|', 1)
    if len(parts) < 2: continue
    rowid = parts[0]
    
    try:
        nodes = json.loads(parts[1])
    except Exception as e:
        continue
    
    modified = False
    for n in nodes:
        if n.get('name') == 'Message Router':
            code = n.get('parameters', {}).get('jsCode', '')
            if 'const cityRaw = String(item.city ||' in code and 'function normalize(str)' not in code:
                # Add normalization
                replacement = """function normalize(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const cityRaw = normalize(String(item.city || 'Global').toLowerCase());
const textRaw = normalize(String(item.text_es || '').toLowerCase());"""
                code = code.replace("const cityRaw = String(item.city || 'Global').toLowerCase();\nconst textRaw = String(item.text_es || '').toLowerCase();", replacement)
                n['parameters']['jsCode'] = code
                modified = True
                
    if modified:
        new_json = json.dumps(nodes)
        new_json_escaped = new_json.replace("'", "''")
        update = f"UPDATE workflow_entity SET nodes='{new_json_escaped}' WHERE rowid={rowid};"
        subprocess.run(['sqlite3', DB, update])
        print(f"Patched row {rowid}")
