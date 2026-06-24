import requests

token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'
url = 'https://gate.whapi.cloud/messages/text'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
payload = {
    'to': '37257825047@s.whatsapp.net',
    'body': 'Prueba de ping a la clienta azerbayana'
}

print(f"Enviando a {payload['to']}...")
resp = requests.post(url, headers=headers, json=payload)
print(f"Status: {resp.status_code}")
print(resp.text)
