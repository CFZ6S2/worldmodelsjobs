import os
import re

root = 'c:/Users/cesar/Documents/trae_projects'
output_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/enlaces_grupos.txt'
links = set()

print(f"Buscando enlaces en {root}...")

for dirpath, dirnames, filenames in os.walk(root):
    if 'node_modules' in dirpath or '.git' in dirpath:
        continue
    for filename in filenames:
        if filename.endswith(('.js', '.txt', '.json', '.db', '.sqlite', '.log')):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, 'rb') as f:
                    content = f.read()
                    matches = re.findall(rb'chat\.whatsapp\.com/[a-zA-Z0-9]+', content)
                    if matches:
                        print(f"Encontrados en: {filepath}")
                        for m in matches:
                            links.add("https://" + m.decode('utf-8'))
            except:
                pass

if links:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sorted(list(links))))
    print(f"Total: {len(links)} enlaces guardados en {output_path}")
else:
    print("No se encontraron enlaces.")
