import re
import os

db_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/n8n_prod.sqlite'
output_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/enlaces_grupos.txt'

if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe")
    exit(1)

print(f"Escaneando {db_path} buscando enlaces...")
links = set()

# Use binary read to scan the whole file for strings
with open(db_path, 'rb') as f:
    content = f.read()
    # Find patterns like chat.whatsapp.com/XXXXX
    matches = re.findall(rb'chat\.whatsapp\.com/[a-zA-Z0-9]+', content)
    for m in matches:
        links.add("https://" + m.decode('utf-8'))

if links:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sorted(list(links))))
    print(f"✅ Se han encontrado {len(links)} enlaces. Guardados en {output_path}")
else:
    print("❌ No se han encontrado enlaces.")
