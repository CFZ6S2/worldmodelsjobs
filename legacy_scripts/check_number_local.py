import urllib.request
import json
import urllib.error

token = "shJOb5wskQMTyfoF20GLqmJOclA5if5j"
url = 'https://gate.whapi.cloud/contacts/447838757923'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Response Code:", response.getcode())
    print("Response Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
