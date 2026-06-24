import sqlite3
import json
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow A0QpoDzX559wzRXQ not found")
    exit(1)

wf_id = row[0]
nodes = json.loads(row[1])

modified = False
for node in nodes:
    if node.get("name") == "Message Router":
        js_code = node.get("parameters", {}).get("jsCode", "")
        if "londonRegex" in js_code:
            print("London already in Message Router for correct workflow!")
            continue
            
        london_block = """
// LONDON
const londonRegex = /(london|londres|mayfair|soho|chelsea|uk|england|inglaterra)/i;
if ((londonRegex.test(cityRaw) || londonRegex.test(textRaw)) && item.category === 'evento') {
  langs.push({ code: 'EN_CLIENT_LONDON', tg: '8688528643', wa: '447838757923@s.whatsapp.net', title: item.title_en || item.title_es || 'New Lead', text: item.text_en || item.text_es || item.texto_limpio, tag: 'Sender' });
}
"""
        
        if "const results = [];" in js_code:
            new_code = js_code.replace("const results = [];", london_block + "\nconst results = [];")
            node["parameters"]["jsCode"] = new_code
            modified = True
            print("Patched Message Router for London in correct workflow!")
        else:
            print("Failed to find 'const results = [];' in Message Router")

if modified:
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?", (json.dumps(nodes), wf_id))
    conn.commit()
    print("Database patched successfully!")
else:
    print("No changes made.")

conn.close()
