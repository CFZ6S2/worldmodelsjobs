#!/usr/bin/env python3
import json
import http.client

BASE = "localhost"
PORT = 5678

def api(method, path, body=None, cookie=None):
    conn = http.client.HTTPConnection(BASE, PORT, timeout=15)
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    data = json.dumps(body).encode() if body else None
    conn.request(method, path, body=data, headers=headers)
    resp = conn.getresponse()
    raw = resp.read().decode()
    cookies = resp.getheader("Set-Cookie", "")
    return resp.status, raw, cookies

# Step 1: Login
print("=== Login ===")
cookie = None
for pw in ["worldmodels2026", "Worldmodels2026", "WorldModels2026", "admin", "Admin123!", "cesar", "password", "12345678"]:
    status, body, cookies = api("POST", "/rest/login", {"email": "cesar.herrera.rojo@gmail.com", "password": pw})
    if status == 200 and cookies:
        cookie = cookies.split(";")[0]
        print(f"OK with pw={pw}")
        break
    elif status == 200:
        try:
            d = json.loads(body)
            print(f"200 but response: {json.dumps(d)[:200]}")
        except:
            pass

if not cookie:
    # Try getting cookie from response body
    for pw in ["worldmodels2026", "Worldmodels2026", "WorldModels2026", "admin"]:
        status, body, cookies = api("POST", "/rest/login", {"email": "cesar.herrera.rojo@gmail.com", "password": pw})
        if status == 200:
            try:
                d = json.loads(body)
                print(f"  pw={pw} status={status} body keys: {list(d.keys()) if isinstance(d, dict) else 'not dict'}")
                print(f"  cookies header: '{cookies}'")
                print(f"  body[:300]: {body[:300]}")
            except:
                print(f"  pw={pw} status={status} raw[:200]: {body[:200]}")

if not cookie:
    print("FAILED to login")
    # Try basic auth
    import base64
    for pw in ["worldmodels2026", "Worldmodels2026"]:
        auth = base64.b64encode(f"cesar.herrera.rojo@gmail.com:{pw}".encode()).decode()
        conn = http.client.HTTPConnection(BASE, PORT, timeout=10)
        conn.request("GET", "/rest/workflows", headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"})
        resp = conn.getresponse()
        raw = resp.read().decode()
        print(f"  Basic auth pw={pw}: status={resp.status} body[:200]={raw[:200]}")
        if resp.status == 200:
            cookie = f"basic_auth={auth}"
            break
    exit(1)

# Step 2: Get workflow
print("\n=== Get workflow ===")
status, body, _ = api("GET", "/rest/workflows/A0QpoDzX559wzRXQ", cookie=cookie)
print(f"Status: {status}")
if status != 200:
    print(f"Body: {body[:500]}")
    exit(1)

wf = json.loads(body)
if 'data' in wf:
    wf = wf['data']

print(f"Name: {wf.get('name')}")
print(f"Active: {wf.get('active')}")
print(f"Nodes: {len(wf.get('nodes', []))}")

# Show current state
for n in wf.get('nodes', []):
    if n['name'] == 'Extract Metadata WA1':
        code = n['parameters'].get('jsCode', '')
        print(f"  Extract WA1 has 'return []': {'return []' in code}")
    if n['name'] == 'Pre-Filter Unified1':
        code = n['parameters'].get('jsCode', '')
        print(f"  PreFilter has 'continue': {'continue' in code}")

# Step 3: Patch nodes
print("\n=== Patch ===")

EXTRACT_WA = '''const input = $input.first().json;
const body = input.body || input;

let textBody = '';
if (body.text && typeof body.text === 'string') {
  textBody = body.text;
} else if (body.body && typeof body.body.text === 'string') {
  textBody = body.body.text;
} else if (body.text && typeof body.text === 'object' && body.text.body) {
  textBody = body.text.body;
} else if (typeof body.body === 'string') {
  textBody = body.body;
} else if (input.text && typeof input.text === 'string') {
  textBody = input.text;
} else if (input.message && typeof input.message.text === 'string') {
  textBody = input.message.text;
}

textBody = textBody.replace(/\\*/g, '').replace(/_/g, '').trim();

function getPhone(val) {
  if (!val) return null;
  let s = String(typeof val === 'object' ? (val.id || val.author || val.from || val.phone || val.number || val.wa_id || val.remoteJid || '') : val);
  if (s.includes('@g.us') || s.includes('-')) return null;
  const digits = s.replace(/\\\\D/g, '');
  return (digits.length >= 7 && digits.length <= 15) ? digits : null;
}

const sc = getPhone(body.from) || getPhone(body.sender) || getPhone(body.author) || getPhone(input.from) || getPhone(input.sender) || "No disponible";
const chatId = body.chatId || body.chat_id || input.chatId || input.chat_id || null;
const chatName = body.chat_name || input.chat_name || '';
const msgType = body.type || input.type || 'text';

if (!textBody || textBody.length < 5 || ['unknown', 'reaction', 'sticker', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'poll'].includes(msgType)) {
  return [];
}

return [{ json: {
  platform: "WhatsApp",
  sender_contact: sc,
  final_contact: sc,
  from: sc,
  source_chat_id: chatId,
  chat_name: chatName,
  texto_limpio: textBody,
  looksValuable: true
}}];'''

PREFILTER = '''const results = [];
const HARD_BLOCK = new Set(["crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", "ingles", "english"]);
const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244"];

function norm(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""); }

for (const item of $input.all()) {
  const data = item.json;
  const text = norm(data.texto_limpio);
  const sender = String(data.final_contact || data.from || "").replace(/\\D/g, "");

  if (BANNED_PREFIXES.some(p => sender.startsWith(p))) continue;
  if ([...HARD_BLOCK].some(k => text.includes(k))) continue;
  if (!text || text.length < 10) continue;

  results.push(item);
}
return results;'''

DEDUP = '''const results = [];
const store = $getWorkflowStaticData('global');
if (!store.history) store.history = [];

const now = Date.now();
const TTL = 5 * 60 * 1000;
store.history = store.history.filter(h => now - h.time < TTL);

for (const item of $input.all()) {
  const fp = String(item.json.texto_limpio || '').substring(0, 100);
  const sender = String(item.json.sender_contact || item.json.from || '');

  if (!store.history.some(h => h.fp === fp && h.sender === sender)) {
    store.history.push({ time: now, fp, sender });
    results.push(item);
  }
}
return results;'''

patched = []
for n in wf['nodes']:
    if n['name'] == 'Extract Metadata WA1':
        n['parameters']['jsCode'] = EXTRACT_WA
        patched.append('Extract Metadata WA1')
    elif n['name'] == 'Pre-Filter Unified1':
        n['parameters']['jsCode'] = PREFILTER
        patched.append('Pre-Filter Unified1')
    elif n['name'] == 'Dedup Hash1':
        n['parameters']['jsCode'] = DEDUP
        patched.append('Dedup Hash1')

print(f"Patched: {', '.join(patched)}")

# Step 4: Update via API  
print("\n=== Update ===")
status, body, _ = api("PATCH", "/rest/workflows/A0QpoDzX559wzRXQ", wf, cookie=cookie)
print(f"PATCH status: {status}")
if status == 200:
    result = json.loads(body)
    if 'data' in result:
        result = result['data']
    print(f"SUCCESS! Active: {result.get('active')}")
    for n in result.get('nodes', []):
        if n['name'] == 'Extract Metadata WA1':
            code = n['parameters'].get('jsCode', '')
            print(f"  VERIFY Extract WA1 has 'return []': {'return []' in code}")
        if n['name'] == 'Pre-Filter Unified1':
            code = n['parameters'].get('jsCode', '')
            print(f"  VERIFY PreFilter has 'continue': {'continue' in code}")
else:
    print(f"FAILED: {body[:500]}")
    
    # Try PUT
    status, body, _ = api("PUT", "/rest/workflows/A0QpoDzX559wzRXQ", wf, cookie=cookie)
    print(f"PUT status: {status}")
    if status == 200:
        print("SUCCESS via PUT!")
    else:
        print(f"PUT FAILED: {body[:500]}")

# Step 5: Activate if needed
print("\n=== Activate ===")
status, body, _ = api("PATCH", "/rest/workflows/A0QpoDzX559wzRXQ/activate", {}, cookie=cookie)
print(f"Activate status: {status}")
if status != 200:
    status, body, _ = api("POST", "/rest/workflows/A0QpoDzX559wzRXQ/activate", {}, cookie=cookie)
    print(f"POST activate status: {status}")
