import json
import re

# Read the large output file from the previous firestore query
input_path = 'C:/Users/cesar/.gemini/antigravity/brain/e9afddd5-7658-4c1e-aa8f-f6a2734ffcec/.system_generated/steps/1461/output.txt'
output_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/enlaces_grupos.txt'

links = set()

print(f"Buscando enlaces en ofertas result...")

try:
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find patterns like chat.whatsapp.com/XXXXX
        matches = re.findall(r'chat\.whatsapp\.com/[a-zA-Z0-9?=&_-]+', content)
        for m in matches:
            links.add("https://" + m)
            
    if links:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(list(links))))
        print(f"Se han encontrado {len(links)} enlaces en ofertas. Guardados en {output_path}")
    else:
        print("No se han encontrado enlaces en ofertas.")
except Exception as e:
    print(f"Error: {e}")
