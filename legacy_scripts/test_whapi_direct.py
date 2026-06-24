import requests

try:
    response = requests.post(
        "https://gate.whapi.cloud/messages/text",
        json={"to": "37257825047@s.whatsapp.net", "body": "Prueba de sistema Whapi directa."},
        headers={"Authorization": "Bearer shJOb5wskQMTyfoF20GLqmJOclA5if5j"}
    )
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
