import requests

url = "http://178.156.186.149:3001/api/leads"
payload = {
    "text_ru": "Тестовое сообщение для проверки системы в Москве 2",
    "text_es": "Mensaje de prueba para revisar el sistema en Moscú 2",
    "city": "Moscú",
    "budget": "1000",
    "category": "evento",
    "contact": "+34600000000",
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
