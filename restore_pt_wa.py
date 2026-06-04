import json

file_path = r'C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['name'] == 'Message Router':
        js = node['parameters']['jsCode']
        target = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
        replacement = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', wa: '5511953600828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
        if target in js:
            js = js.replace(target, replacement)
            node['parameters']['jsCode'] = js
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("Successfully added +55 back to PT_CLIENT")
        else:
            print("Target not found")
