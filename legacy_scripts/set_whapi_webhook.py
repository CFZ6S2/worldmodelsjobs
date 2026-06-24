import requests

token = "6dxe5j9EArbBfp9OgbP0EhcNXWUNVZFs"
url = "https://gate.whapi.cloud/settings"

headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": f"Bearer {token}"
}

# The N8N webhook URL
webhook_url = "http://178.156.186.149:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef"

payload = {
    "webhooks": [
        {
            "url": webhook_url,
            "events": [
                {
                    "type": "message",
                    "method": "post"
                }
            ],
            "mode": "body"
        }
    ]
}

response = requests.patch(url, json=payload, headers=headers)
print(response.text)
