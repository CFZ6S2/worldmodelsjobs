import urllib.request
import urllib.error
import json

url = 'https://api.telegram.org/bot8566658948:AAG3fx9DGdPRqLV963MuuD23ucexTEy-z4c/getChat?chat_id=-1002378331399'

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
