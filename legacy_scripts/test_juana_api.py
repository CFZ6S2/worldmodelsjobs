import requests

try:
    response = requests.post(
        "http://127.0.0.1:3001/api/juana/send",
        json={"to": "37257825047@s.whatsapp.net", "body": "Prueba de sistema desde IT."},
        headers={"Authorization": "Bearer DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP"}
    )
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
