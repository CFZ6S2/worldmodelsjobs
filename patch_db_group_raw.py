import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
nodes_str = row[1]

# We need to add the PT_GROUP push. We can do it directly on the raw string since JSON might be slightly malformed.
old_push = r"langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n}"
new_push = r"langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n}"

# Fix the backslash issue if there is any by doing raw string replace
if r"\b" in nodes_str and not r"\\b" in nodes_str:
    # Actually wait, the JS had /\b(monaco...)\b/i so it's literal \b
    pass

if old_push in nodes_str:
    nodes_str = nodes_str.replace(old_push, new_push)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (nodes_str,))
    conn.commit()
    print("Database patched directly via string replace!")
else:
    print("Old push not found in string! Looking for something else...")
    # Maybe the newline is \r\n or something
    old_push_2 = r"langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
    new_push_2 = r"langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });\n  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
    if old_push_2 in nodes_str:
        nodes_str = nodes_str.replace(old_push_2, new_push_2)
        c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (nodes_str,))
        conn.commit()
        print("Database patched directly via string replace (method 2)!")
    else:
        print("Could not find the target string.")

# ALSO try to fix the malformed json so the UI works
# The problem was likely a literal python \b (backspace) which json.dumps put into the string.
# A literal backspace in json string is '\b'. Wait, JSON allows \b for backspace.
# But python's re.sub might have messed it up.
# Let's replace raw \x08 with \\b
nodes_str = nodes_str.replace("\x08", "\\\\b")
c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (nodes_str,))
conn.commit()

conn.close()
