import requests

token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'
phone = '37257825047'

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
}

url = f'https://gate.whapi.cloud/contacts/{phone}'
try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
