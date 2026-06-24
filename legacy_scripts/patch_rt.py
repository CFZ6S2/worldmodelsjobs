import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node.get('name') == 'Message Router':
            code = node['parameters']['jsCode']
            
            # Add Russia/Turkey Telegram routing
            rt_code = r"""
// RUSSIA_TURKEY
const russiaTurkeyRegex = /(rusia|russia|\bru\b|россия|moscu|moscow|москва|san petersburgo|saint petersburg|st petersburg|санкт-петербург|питер|kazan|казань|sochi|сочи|vladivostok|владивосток|novosibirsk|новосибирск|ekaterimburgo|yekaterinburg|екатеринбург|baku|баку|tiflis|tbilisi|тбилиси|kiev|kyiv|киев|київ|киів|turquia|turkey|türkiye|турция|estambul|istanbul|стамбул|ankara|анкара|antalya|анталья|анталия|izmir|esmirna|измир|bodrum|бодрум|bursa|бурса|capadocia|cappadocia|каппадокия)/i;
if (russiaTurkeyRegex.test(cityRaw) || russiaTurkeyRegex.test(textRaw)) {
  if (item.category !== 'plaza') {
    langs.push({ 
      code: 'RU_CLIENT_RT', 
      tg: '1800004016', 
      wa: '', 
      title: item.title_ru || item.title_es || 'Новый Лид', 
      text: item.text_ru || item.text_es || item.texto_limpio, 
      tag: 'Отправитель' 
    });
  }
}

const results = [];"""
            
            if "RUSSIA_TURKEY" not in code:
                code = code.replace("const results = [];", rt_code)
                node['parameters']['jsCode'] = code
                print("Patched Message Router for Telegram.")

        elif node.get('name') == 'Dynamic Routing Engine':
            code = node['parameters']['jsCode']
            
            rt_routing = r"""  "russia_turkey": {
    keywords: ["rusia", "russia", "\\bru\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: [
      { to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", categoryFilter: "evento" }
    ]
  },
  "madrid":"""
            if "russia_turkey" not in code:
                code = code.replace('"madrid":', rt_routing)
                node['parameters']['jsCode'] = code
                print("Patched Dynamic Routing Engine for WhatsApp.")

        elif node.get('name') == 'Dynamic WhatsApp Alert':
            code = node['parameters']['jsonBody']
            
            rt_body = r"""  if (label === 'RUSSIA_TURKEY') {
    return { 
       "to": target, 
       "body": "*📢 НОВЫЙ ЛИД " + label + "*\n📍 *" + ($json.city || "Неизвестно") + "* | 💰 *" + ($json.budget || "Договорная") + "*\n\n" + ($json.text_ru || $json.text_es || "Нет описания") + "\n\n👤 *Отправитель:* " + ($json.contact || "Неизвестный") + "\n🔌 *Источник:* " + ($json.platform || "WhatsApp") 
    };
  }
  else if (label === 'COSTA AZUL' || label === 'MADRID (PT)') {"""
            
            if "RUSSIA_TURKEY" not in code:
                code = code.replace("if (label === 'COSTA AZUL' || label === 'MADRID (PT)') {", rt_body)
                node['parameters']['jsonBody'] = code
                print("Patched Dynamic WhatsApp Alert for Russian language.")

    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully updated database.")

except Exception as e:
    print(f"Script Error: {e}")
