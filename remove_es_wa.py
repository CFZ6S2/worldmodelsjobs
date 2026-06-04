import json

file_path = r'C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['name'] == 'Message Router':
        js_code = node['parameters']['jsCode']
        
        target = "langs.push({ code: 'ES', tg: '-1002209736528', wa: '120363425790792660@g.us', title: item.title_es || item.title_pt || 'Nuevo Lead', text: item.text_es || item.text_pt || item.texto_limpio, tag: 'Remitente' });"
        replacement = "langs.push({ code: 'ES', tg: '-1002209736528', title: item.title_es || item.title_pt || 'Nuevo Lead', text: item.text_es || item.text_pt || item.texto_limpio, tag: 'Remitente' });"
        
        if target in js_code:
            node['parameters']['jsCode'] = js_code.replace(target, replacement)
            with open(file_path, 'w', encoding='utf-8') as out:
                json.dump(data, out, indent=2, ensure_ascii=False)
            print("Successfully removed ES WA group!")
        else:
            print("Error: Could not find the ES target string in jsCode.")
