import requests

url = "http://localhost:3001/api/leads"
data = {
    "text_es": "Agencia busca modelo para evento en Amsterdam la proxima semana.",
    "contact": "+34600000000",
    "platform": "telegram",
    "chatId": "-100123456"
}

try:
    response = requests.post(url, json=data)
    print("Response Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)
