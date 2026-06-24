import sqlite3
import json
import re

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow not found!")
    exit(1)

nodes_str = row[1]
nodes = json.loads(nodes_str)

found = False
for node in nodes:
    if node.get("name") == "Message Router":
        js_code = node.get("parameters", {}).get("jsCode", "")
        
        old_template = """  const categoryStr = (item.category === 'plaza') ? 'Plazas' : 'Eventos';

  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>Fuente:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;"""

        new_template = """  const isPt = l.code.startsWith('PT');
  const categoryStr = (item.category === 'plaza') ? (isPt ? 'Vagas' : 'Plazas') : 'Eventos';
  const unkCity = isPt ? 'Desconhecida' : 'Desconocida';
  const unkBudget = isPt ? 'Negociável' : 'Negociable';
  const noText = isPt ? 'Sem descrição' : 'Sin texto';
  const sourceLabel = isPt ? 'Fonte' : 'Fuente';

  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || unkCity)}</b>\\n💰 <b>${escapeHTML(item.budget || unkBudget)}</b>\\n\\n${escapeHTML(l.text || noText)}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>${sourceLabel}:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;"""

        if old_template in js_code:
            node["parameters"]["jsCode"] = js_code.replace(old_template, new_template)
            found = True
        else:
            print("Template not found in Message Router!")

if found:
    new_nodes_str = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_str,))
    conn.commit()
    print("Database patched successfully!")
else:
    print("Code not found to patch!")

conn.close()
