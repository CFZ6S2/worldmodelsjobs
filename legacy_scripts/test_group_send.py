import requests

token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'
group_id = '120363425790792660@g.us'

url = 'https://gate.whapi.cloud/messages/text'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
payload = {
    'to': group_id,
    'body': 'Prueba técnica de conexión del bot'
}

response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.text)

# Also get settings to see who the bot is
settings_url = 'https://gate.whapi.cloud/settings'
settings_resp = requests.get(settings_url, headers={'Authorization': f'Bearer {token}'})
print("Settings:")
print(settings_resp.text)
