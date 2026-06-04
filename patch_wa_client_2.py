import json

file_path = r'C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['name'] == 'Message Router':
        js_code = node['parameters']['jsCode']
        
        # Replace the PT_CLIENT line
        target = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
        replacement = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', wa: '447471373828@s.whatsapp.net', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
        
        if target in js_code:
            node['parameters']['jsCode'] = js_code.replace(target, replacement)
            with open(file_path, 'w', encoding='utf-8') as out:
                json.dump(data, out, indent=2, ensure_ascii=False)
            print("Successfully patched PT_CLIENT with WA number!")
        else:
            print("Error: Could not find the target string in jsCode.")
