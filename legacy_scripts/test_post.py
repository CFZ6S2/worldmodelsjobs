import urllib.request
import json

url = 'http://127.0.0.1:3001/api/juana/send'
headers = {
    'Authorization': 'Bearer shJOb5wskQMTyfoF20GLqmJOclA5if5j',
    'Content-Type': 'application/json'
}
data = {
    "to": "37257825047@s.whatsapp.net",
    "body": "Prueba de sistema"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
