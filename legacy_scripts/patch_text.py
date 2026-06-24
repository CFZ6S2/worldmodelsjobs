import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    if not row:
        print("Workflow not found!")
        exit(1)

    nodes = json.loads(row['nodes'])
    updated = False

    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            js_code = node.get('parameters', {}).get('jsCode', '')
            
            # Patch the text variable to include all possible language fields from DeepSeek
            old_text_def = "const text = normalize(String(leadData.texto_limpio || leadData.text_es || '').toLowerCase());"
            new_text_def = "const text = normalize(String(leadData.texto_limpio || leadData.text_es || leadData.text_en || leadData.text_pt || leadData.text || leadData.body || JSON.stringify(leadData) || '').toLowerCase());"
            
            if old_text_def in js_code:
                js_code = js_code.replace(old_text_def, new_text_def)
                node['parameters']['jsCode'] = js_code
                updated = True
                print("Patched Dynamic Routing Engine text fallback")
                
        elif node.get('name') == 'Message Router':
            js_code = node.get('parameters', {}).get('jsCode', '')
            
            # Patch the text variable in Message Router too
            old_text_def = "const textRaw = normalize(String(item.texto_limpio || item.text_es || '').toLowerCase());"
            new_text_def = "const textRaw = normalize(String(item.texto_limpio || item.text_es || item.text_en || item.text_pt || item.text || item.body || JSON.stringify(item) || '').toLowerCase());"
            
            if old_text_def in js_code:
                js_code = js_code.replace(old_text_def, new_text_def)
                node['parameters']['jsCode'] = js_code
                updated = True
                print("Patched Message Router text fallback")

    if updated:
        c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
        conn.commit()
        print("Database updated successfully!")
    else:
        print("No changes made. Code may already be patched or not found.")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
