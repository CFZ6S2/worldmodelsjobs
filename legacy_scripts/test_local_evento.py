import requests

url = "http://localhost:3001/api/leads"
payload = {
    "text_es": "Evento en Moscú esta noche, 3 horas. Urgente 1000 euros.",
    "city": "Moscú",
    "budget": "1000",
    "category": "evento",
    "contact": "+34600000001",
    "platform": "whatsapp",
    "chatId": "120363425790792660@g.us",
    "isGroup": True
}

try:
    print("Sending webhook...")
    response = requests.post(url, json=payload, timeout=10)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
