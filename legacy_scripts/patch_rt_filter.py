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
    
    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            code = node['parameters']['jsCode']
            
            # Remove categoryFilter: "evento" from RUSSIA_TURKEY
            old_rt = r'\{\s*to:\s*"37257825047@s\.whatsapp\.net",\s*label:\s*"RUSSIA_TURKEY",\s*categoryFilter:\s*"evento"\s*\}'
            new_rt = '{ to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY" }'
            code = re.sub(old_rt, new_rt, code)
            
            node['parameters']['jsCode'] = code

        elif node.get('name') == 'Message Router':
            code = node['parameters']['jsCode']
            
            # Remove the if (item.category !== 'plaza') wrapper around RU_CLIENT_RT
            # Find the block
            old_block = r'''if \(item\.category !== 'plaza'\) \{\s*langs\.push\(\{\s*code: 'RU_CLIENT_RT', \s*tg: '1800004016',\s*wa: '', \s*title: item\.title_ru \|\| item\.title_es \|\| 'Новый Лид',\s*text: item\.text_ru \|\| item\.text_es \|\| item\.texto_limpio, \s*tag: 'Отправитель' \s*\}\);\s*\}'''
            
            new_block = '''langs.push({ 
      code: 'RU_CLIENT_RT', 
      tg: '1800004016', 
      wa: '', 
      title: item.title_ru || item.title_es || 'Новый Лид', 
      text: item.text_ru || item.text_es || item.texto_limpio, 
      tag: 'Отправитель' 
    });'''
            code = re.sub(old_block, new_block, code)
            node['parameters']['jsCode'] = code


    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully removed Russia/Turkey filters.")

except Exception as e:
    print(f"Script Error: {e}")
