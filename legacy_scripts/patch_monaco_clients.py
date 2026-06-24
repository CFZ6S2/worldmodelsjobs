import sqlite3
import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Helper to fetch current nodes
def get_nodes(rowid):
    result = subprocess.run(['sqlite3', DB, f"SELECT nodes FROM workflow_entity WHERE rowid={rowid};"], capture_output=True, text=True)
    raw = result.stdout.strip()
    if not raw: return None
    try:
        return json.loads(raw)
    except:
        return None

# Get rowids
result = subprocess.run(['sqlite3', DB, "SELECT rowid FROM workflow_entity;"], capture_output=True, text=True)
rows = [r.strip() for r in result.stdout.strip().split('\n') if r.strip()]

for rowid in rows:
    nodes = get_nodes(rowid)
    if not nodes: continue
    
    modified = False
    for n in nodes:
        name = n.get('name')
        
        # 1. Update Message Router (Telegram)
        if name == 'Message Router':
            code = n.get('parameters', {}).get('jsCode', '')
            if "langs.push({ code: 'PT_CLIENT_2'" in code and "8653719069" not in code:
                # Add Telegram client
                insertion = "\n  // Cliente 3 (Nuevo Telegram)\n  langs.push({ code: 'PT_CLIENT_3', tg: '8653719069', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n"
                
                # Replace right before the PT_GROUP line
                target = "langs.push({ code: 'PT_GROUP'"
                new_code = code.replace(target, insertion.strip('\n') + "\n  " + target)
                n['parameters']['jsCode'] = new_code
                modified = True
                print(f"Patched Message Router on row {rowid}")

        # 2. Update Dynamic Routing Engine (WhatsApp)
        if name == 'Dynamic Routing Engine':
            code = n.get('parameters', {}).get('jsCode', '')
            if '"costa_azul"' in code and "447471373828" not in code:
                # Add WhatsApp client
                target = '{ to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" }'
                insertion = target + ',\n      { to: "447471373828@s.whatsapp.net", label: "COSTA AZUL" }'
                new_code = code.replace(target, insertion)
                n['parameters']['jsCode'] = new_code
                modified = True
                print(f"Patched Dynamic Routing Engine on row {rowid}")
                
    if modified:
        new_json = json.dumps(nodes)
        new_json_escaped = new_json.replace("'", "''")
        update = f"UPDATE workflow_entity SET nodes='{new_json_escaped}' WHERE rowid={rowid};"
        subprocess.run(['sqlite3', DB, update])
        print(f"Row {rowid} saved to DB.")

print("Finished patching. Please restart n8n.")
