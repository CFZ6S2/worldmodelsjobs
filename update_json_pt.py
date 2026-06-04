import json
import os

file_path = r"C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for node in data.get("nodes", []):
    if node.get("name") == "Message Router":
        js_code = node["parameters"]["jsCode"]
        old_template = """  const categoryStr = (item.category === 'plaza') ? 'Plazas' : 'Eventos';

  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || 'Desconocida')}</b>\\n💰 <b>${escapeHTML(item.budget || 'Negociable')}</b>\\n\\n${escapeHTML(l.text || 'Sin texto')}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>Fuente:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;"""

        new_template = """  const isPt = l.code.startsWith('PT');
  const categoryStr = (item.category === 'plaza') ? (isPt ? 'Vagas' : 'Plazas') : 'Eventos';
  const unkCity = isPt ? 'Desconhecida' : 'Desconocida';
  const unkBudget = isPt ? 'Negociável' : 'Negociable';
  const noText = isPt ? 'Sem descrição' : 'Sin texto';
  const sourceLabel = isPt ? 'Fonte' : 'Fuente';

  const tgText = `<b>${escapeHTML(l.title)}</b>\\n🏷️ <b>${categoryStr}</b>\\n📍 <b>${escapeHTML(item.city || unkCity)}</b>\\n💰 <b>${escapeHTML(item.budget || unkBudget)}</b>\\n\\n${escapeHTML(l.text || noText)}\\n\\n👤 <b>${l.tag}:</b> ${tgContact}\\n🔌 <b>${sourceLabel}:</b> ${escapeHTML(item.platform || 'WhatsApp')}`;"""
        
        node["parameters"]["jsCode"] = js_code.replace(old_template, new_template)

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("JSON file fully updated with PT translations.")
