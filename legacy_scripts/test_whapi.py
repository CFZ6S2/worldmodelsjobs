import requests

url = "https://gate.whapi.cloud/messages/text"
headers = {
    "Authorization": "Bearer shJOb5wskQMTyfoF20GLqmJOclA5if5j",
    "Accept": "application/json",
    "Content-Type": "application/json"
}
payload = {
    "to": "120363425790792660@g.us",
    "body": "Test message from API"
}

try:
    response = requests.post(url, headers=headers, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
