import json
import os

file_path = r"C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for node in data.get("nodes", []):
    if node.get("name") == "Message Router":
        js_code = node["parameters"]["jsCode"]
        if "5479166354" in js_code:
            # We want to add the group as well as keeping the client.
            # Let's replace the single push with two pushes.
            old_push = "langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"
            new_push = """// Envía a la clienta (si ya inició el bot)
  langs.push({ code: 'PT_CLIENT', tg: '5479166354', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });
  // Envía al grupo de referencias
  langs.push({ code: 'PT_GROUP', tg: '-1003918368381', title: item.title_pt || item.title_es || 'Novo Lead', text: item.text_pt || item.text_es || item.texto_limpio, tag: 'Remetente' });"""
            
            node["parameters"]["jsCode"] = js_code.replace(old_push, new_push)

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("JSON file updated successfully.")
