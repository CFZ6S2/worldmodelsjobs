import json

file_path = r'C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
replacement = target + "\n  langs.push({ code: 'PT_CLIENT_2', tg: '8799609531', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"

if target not in content:
    print("Error: Target not found")
else:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched successfully!")
