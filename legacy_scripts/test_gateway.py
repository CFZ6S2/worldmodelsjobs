import urllib.request, json

data = json.dumps({'to': '447471373828@s.whatsapp.net', 'body': 'Test'}).encode('utf-8')
try:
    req = urllib.request.Request('http://localhost:3001/api/juana/send', data=data, headers={'Authorization': 'Bearer shJOb5wskQMTyfoF20GLqmJOclA5if5j', 'Content-Type': 'application/json'})
    print(urllib.request.urlopen(req).read())
except Exception as e:
    print(f"Error: {e}")
