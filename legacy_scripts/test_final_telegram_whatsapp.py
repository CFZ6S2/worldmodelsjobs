import requests
import json
import time
import random

webhook_url = "http://178.156.186.149/n8n/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef"

random_num = random.randint(1000000, 9999999)
payload = {
    "message": {
        "conversation": f"Buscamos 2 chicas para evento vip en Moscu, rusia hoy, pago 5000 usd. Interesadas enviar fotos. Ref {random_num}",
        "from": f"123456{random_num}@s.whatsapp.net",
        "messageTimestamp": int(time.time()),
        "key": {
            "remoteJid": f"123456{random_num}@s.whatsapp.net",
            "fromMe": False,
            "id": f"TEST_MOSCU_{random_num}"
        }
    }
}

print("Sending directly to N8N webhook...")
try:
    response = requests.post(webhook_url, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
