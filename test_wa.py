import requests
import json

url = "http://localhost:3001/api/juana/send"

payloads = [
    {"to": "33672474796@s.whatsapp.net", "body": "Test with suffix"},
    {"to": "33672474796", "body": "Test without suffix"},
    {"to": "+33672474796", "body": "Test with plus"}
]

for p in payloads:
    print(f"Testing {p['to']}...")
    try:
        res = requests.post(url, json=p)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)
