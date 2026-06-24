import requests
import json

url = "http://localhost:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef"

payload = {
    "data": {
        "key": {
            "remoteJid": "120363425790792660@g.us",
            "participant": "34600000000@s.whatsapp.net"
        },
        "message": {
            "conversation": "Sexta plaza en Bodrum, Turquía, a ver si N8N lo pilla."
        }
    }
}

try:
    print("Sending directly to N8N webhook...")
    response = requests.post(url, json=payload, timeout=10)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
