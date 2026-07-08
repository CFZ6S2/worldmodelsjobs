import requests

payload = {
    'text_ru': 'Cliente busca modelo TOP para evento en Moscu este fin de semana.',
    'text_es': 'Cliente busca modelo TOP para evento en Moscu este fin de semana.',
    'city': 'Moscú',
    'budget': '1500',
    'category': 'evento',
    'contact': '+34600000001',
    'platform': 'whatsapp',
    'chatId': '120363425790792660@g.us', 
    'isGroup': True
}

try:
    r = requests.post('http://localhost:3001/api/leads', json=payload)
    print(r.status_code, r.text)
except Exception as e:
    print('Error:', e)
