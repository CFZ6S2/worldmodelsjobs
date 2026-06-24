import requests
import json

token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'
url = 'https://gate.whapi.cloud/chats?limit=100'

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
}

try:
    response = requests.get(url, headers=headers)
    chats = response.json().get('chats', [])
    
    found_chats = []
    for chat in chats:
        jid = chat.get('id', '')
        name = chat.get('name', '')
        
        # We want to find the Estonia number (372) and the Spain number (34670652138)
        if '372' in jid or '5782' in jid or '5047' in jid or '67065' in jid:
            found_chats.append({'id': jid, 'name': name})
            
    print(json.dumps(found_chats, indent=2))
    
    if not found_chats:
        print("Could not find any chats matching 372... or 34670652138 in the last 100 chats.")
        # Let's just print the first 10 chats to see what they look like
        print("First 5 chats in list:")
        for c in chats[:5]:
            print(c.get('id'), c.get('name'))

except Exception as e:
    print(f"Error: {e}")
