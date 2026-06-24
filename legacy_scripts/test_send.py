import requests
import json

token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'
url = 'https://gate.whapi.cloud/messages/text'

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

payload = {
    "to": "37257825047@s.whatsapp.net",
    "body": "Test message from system"
}

try:
    print("Testing 37257825047...")
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    payload["to"] = "34670652138@s.whatsapp.net"
    print("\nTesting 34670652138...")
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
