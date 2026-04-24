import sqlite3
import re
import os

db_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/n8n_prod.sqlite'
output_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/enlaces_grupos.txt'

if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    # Check if table exists
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='execution_entity'")
    if not cur.fetchone():
        print("Table execution_entity not found")
        exit(1)

    cur.execute('SELECT data FROM execution_entity')
    links = set()
    print("Buscando enlaces en n8n_prod.sqlite...")
    
    for row in cur:
        if row[0]:
            matches = re.findall(r'chat\.whatsapp\.com\/[a-zA-Z0-9]+', str(row[0]))
            for m in matches:
                links.add("https://" + m)

    if links:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(list(links))))
        print(f"✅ Se han encontrado {len(links)} enlaces. Guardados en {output_path}")
    else:
        print("❌ No se han encontrado enlaces.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
