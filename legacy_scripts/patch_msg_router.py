import sqlite3
import json

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

new_code = """const item = $input.first()?.json || {};
function escapeHTML(text) { return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const langs = [
  { code: 'ES', tg: '-5283488138', title: item.title_es || 'Nuevo Lead', text: item.text_es || item.texto_limpio, tag: 'Remitente' }
];

// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
const cityRaw = String(item.city || 'Global').toLowerCase();
const textRaw = String(item.text_es || '').toLowerCase();
const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {
  langs.push({ code: 'PT_CLIENT', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
}
// -----------------------------------

const results = [];
for (const l of langs) {
  function formatOutputContact(val, mode) {
    if (!val || val === 'Desconocido' || val === 'No disponible') return 'No disponible';
    if (String(val).startsWith('tg_id_')) {
      const id = val.replace('tg_id_', '');
      return mode === 'html' ? `<a href="tg://user?id=${id}">Chat Directo</a>` : `ID: ${id}`;
    }
    if (/[a-zA-Z]/.test(val) && !/\\d/.test(val)) {
       const user = String(val).replace('@', '');
       return mode === 'html' ? `<a href="https://t.me/${user}">@${user}</a>` : `@${user}`;
    }
    const s = String(val).replace(/[^0-9]/g, '');
    return s.length >= 7 ? `+${s}` : val;
  }

  const tgContact = formatOutputContact(item.contact || item.final_contact, 'html');

  const categoryStr = (item.category === 'plaza') ? 'Plazas' : 'Eventos';

  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>Fuente:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;
  
  results.push({
    json: { ...item, route_lang: l.code, tg_chat: l.tg, tg_text: tgText }
  });
}
return results;"""

found = False
for node in nodes:
    if node.get("name") == "Message Router":
        if "parameters" not in node:
            node["parameters"] = {}
        node["parameters"]["jsCode"] = new_code
        found = True
        break

if found:
    new_nodes_str = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_str,))
    conn.commit()
    print("Database patched successfully!")
else:
    print("Node not found!")

conn.close()
