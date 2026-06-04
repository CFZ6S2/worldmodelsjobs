import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes = json.loads(row[1])

found = False
for node in nodes:
    if node.get("name") == "Message Router":
        js_code = node.get("parameters", {}).get("jsCode", "")
        
        old_push = """if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw) || cityRaw === 'nice' || textRaw.includes('#nice')) {
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}"""
        
        new_push = """if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw) || cityRaw === 'nice' || textRaw.includes('#nice')) {
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}"""

        if old_push in js_code:
            node["parameters"]["jsCode"] = js_code.replace(old_push, new_push)
            found = True

if found:
    new_nodes_str = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_str,))
    conn.commit()
    print("Database patched to add group!")
else:
    print("Push code not found!")

conn.close()
