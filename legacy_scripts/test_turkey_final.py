import requests
import time

url = "http://localhost:3001/api/leads"
payload = {
    "text_es": "Quinta plaza en Bodrum, Turquía, prueba final.",
    "city": "Bodrum",
    "budget": "3000",
    "category": "plaza",
    "contact": "+34600000005",
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
