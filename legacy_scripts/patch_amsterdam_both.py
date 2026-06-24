import sqlite3
import json
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    
    nodes = json.loads(row['nodes'])
    
    # 1. Update Dynamic Routing Engine (for WhatsApp)
    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            code = node['parameters']['jsCode']
            
            if '"amsterdam"' not in code:
                # Insert amsterdam before london
                amsterdam_block = """  "amsterdam": {
    keywords: ["amsterdam", "holanda", "paises bajos", "netherlands", "nederland", "rotterdam", "la haya", "schiphol", "utrecht"],
    targets: [
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM" }
    ]
  },"""
                code = code.replace('"london": {', amsterdam_block + '\n  "london": {')
                node['parameters']['jsCode'] = code
                print("Patched Dynamic Routing Engine (WhatsApp)")

        if node.get('name') == 'Message Router':
            code = node['parameters']['jsCode']
            if 'AMSTERDAM' not in code:
                amsterdam_block = """
// AMSTERDAM
const amsterdamRegex = /(amsterdam|holanda|paises bajos|netherlands|nederland|rotterdam|la haya|schiphol|utrecht)/i;
if (amsterdamRegex.test(cityRaw) || amsterdamRegex.test(textRaw)) {
  langs.push({ code: 'ES_CLIENT_AMSTERDAM', tg: '6630067001', wa: '584162013551@s.whatsapp.net', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' });
}
"""
                code = code.replace('// LONDON', amsterdam_block + '\n// LONDON')
                node['parameters']['jsCode'] = code
                print("Patched Message Router (Telegram)")

    # Save back
    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully patched Amsterdam into N8N Database.")

except Exception as e:
    print(f"Script Error: {e}")
