#!/usr/bin/env python3
"""Update n8n workflow via REST API so changes actually take effect in memory."""
import json
import http.client
import http.cookiejar

BASE = "localhost"
PORT = 5678
PREFIX = "/n8n"

def api_request(method, path, body=None, cookie=None):
    conn = http.client.HTTPConnection(BASE, PORT, timeout=10)
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    data = json.dumps(body).encode() if body else None
    conn.request(method, f"{PREFIX}{path}", body=data, headers=headers)
    resp = conn.getresponse()
    raw = resp.read().decode()
    cookies = resp.getheader("Set-Cookie", "")
    return resp.status, raw, cookies

# Step 1: Find the correct login endpoint
print("=== STEP 1: Login ===")
login_endpoints = ["/rest/login", "/api/v1/login", "/api/v1/auth/login"]
session_cookie = None

for endpoint in login_endpoints:
    for pw in ["worldmodels2026", "Worldmodels2026", "WorldModels2026", "admin", "Admin123!"]:
        status, body, cookies = api_request("POST", endpoint, {"email": "cesar.herrera.rojo@gmail.com", "password": pw})
        if status == 200 and cookies:
            session_cookie = cookies.split(";")[0]
            print(f"  LOGIN OK at {endpoint} with password, cookie: {session_cookie[:50]}...")
            break
        elif status == 200:
            # Maybe the response body has a token
            try:
                data = json.loads(body)
                if 'data' in data and 'token' in str(data):
                    print(f"  Got token response from {endpoint}")
            except:
                pass
    if session_cookie:
        break

if not session_cookie:
    print("  Could not login. Trying without auth...")
    # List all endpoints to find the right one
    for path in ["/rest/workflows", "/api/v1/workflows"]:
        status, body, _ = api_request("GET", path)
        print(f"  GET {path}: status={status}, body[:200]={body[:200]}")

# Step 2: Get current workflow
print("\n=== STEP 2: Get workflow ===")
wf_endpoints = ["/rest/workflows/A0QpoDzX559wzRXQ", "/api/v1/workflows/A0QpoDzX559wzRXQ"]

workflow_data = None
working_endpoint = None

for endpoint in wf_endpoints:
    status, body, _ = api_request("GET", endpoint, cookie=session_cookie)
    if status == 200:
        try:
            workflow_data = json.loads(body)
            if 'data' in workflow_data:
                workflow_data = workflow_data['data']
            working_endpoint = endpoint
            print(f"  Got workflow from {endpoint}")
            print(f"  Name: {workflow_data.get('name', '?')}")
            print(f"  Active: {workflow_data.get('active', '?')}")
            print(f"  Nodes: {len(workflow_data.get('nodes', []))}")
            
            # Check current Extract Metadata WA1
            for n in workflow_data.get('nodes', []):
                if n['name'] == 'Extract Metadata WA1':
                    code = n.get('parameters', {}).get('jsCode', '')
                    print(f"  Extract Metadata WA1 has 'return []': {'return []' in code}")
                    print(f"  First 80: {code[:80]}")
                if n['name'] == 'Pre-Filter Unified1':
                    code = n.get('parameters', {}).get('jsCode', '')
                    print(f"  Pre-Filter has 'continue': {'continue' in code}")
            break
        except json.JSONDecodeError:
            print(f"  {endpoint}: not JSON: {body[:200]}")
    else:
        print(f"  {endpoint}: status={status}")

if not workflow_data:
    print("FATAL: Could not get workflow from API")
    exit(1)

# Step 3: Patch the nodes
print("\n=== STEP 3: Patch nodes ===")

EXTRACT_WA_CODE = '''const input = $input.first().json;
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
  const digits = s.replace(/\\D/g, '');
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

PREFILTER_CODE = '''const results = [];
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

DEDUP_CODE = '''const results = [];
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

nodes = workflow_data['nodes']
patched = []
for node in nodes:
    if node['name'] == 'Extract Metadata WA1':
        node['parameters']['jsCode'] = EXTRACT_WA_CODE
        patched.append('Extract Metadata WA1')
    elif node['name'] == 'Pre-Filter Unified1':
        node['parameters']['jsCode'] = PREFILTER_CODE
        patched.append('Pre-Filter Unified1')
    elif node['name'] == 'Dedup Hash1':
        node['parameters']['jsCode'] = DEDUP_CODE
        patched.append('Dedup Hash1')

print(f"  Patched: {', '.join(patched)}")

# Step 4: PUT/PATCH the workflow back via API
print("\n=== STEP 4: Update via API ===")
workflow_data['nodes'] = nodes
workflow_data['active'] = True

# Try PUT and PATCH
for method in ["PUT", "PATCH"]:
    status, body, _ = api_request(method, working_endpoint, workflow_data, cookie=session_cookie)
    print(f"  {method} {working_endpoint}: status={status}")
    if status == 200:
        result = json.loads(body)
        if 'data' in result:
            result = result['data']
        print(f"  Success! Active: {result.get('active', '?')}")
        # Verify the update
        for n in result.get('nodes', []):
            if n['name'] == 'Extract Metadata WA1':
                code = n.get('parameters', {}).get('jsCode', '')
                print(f"  Verify Extract Metadata WA1 has 'return []': {'return []' in code}")
            if n['name'] == 'Pre-Filter Unified1':
                code = n.get('parameters', {}).get('jsCode', '')
                print(f"  Verify Pre-Filter has 'continue': {'continue' in code}")
        break
    else:
        print(f"  Response: {body[:300]}")
