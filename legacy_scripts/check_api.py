import json
import urllib.request
import sqlite3

# First get the current workflow via API
api_url = "http://localhost:5678/api/v1/workflows/A0QpoDzX559wzRXQ"
api_key = None

# Try to get API key from env or config
import os
api_key = os.environ.get('N8N_API_KEY', '')

# Try reading from n8n config  
if not api_key:
    try:
        with open('/root/worldmodels-jobs/.env', 'r') as f:
            for line in f:
                if 'N8N_API_KEY' in line or 'N8N_ENCRYPTION_KEY' in line:
                    print(f"ENV: {line.strip()}")
    except:
        pass

# Try without auth first
headers = {"Accept": "application/json"}
if api_key:
    headers["X-N8N-API-KEY"] = api_key

try:
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        wf = json.loads(resp.read())
        print(f"Got workflow via API: {wf.get('name', '?')}")
        print(f"Active: {wf.get('active', '?')}")
        print(f"Number of nodes: {len(wf.get('nodes', []))}")
        
        # Show Extract Metadata WA1 code from API
        for node in wf.get('nodes', []):
            if node['name'] == 'Extract Metadata WA1':
                code = node['parameters'].get('jsCode', '')
                print(f"\nExtract Metadata WA1 from API:")
                print(f"  Has 'return []': {'return []' in code}")
                print(f"  First 100 chars: {code[:100]}")
            if node['name'] == 'Pre-Filter Unified1':
                code = node['parameters'].get('jsCode', '')
                print(f"\nPre-Filter from API:")
                print(f"  Has 'continue': {'continue' in code}")
                print(f"  First 100 chars: {code[:100]}")
except urllib.error.HTTPError as e:
    print(f"API error: {e.code} {e.reason}")
    print(f"Response: {e.read().decode()[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Also check if there's basic auth
print("\n\nChecking n8n env vars...")
try:
    result = os.popen("docker exec n8n env | grep -i 'N8N\\|AUTH\\|API'").read()
    print(result)
except:
    print("Could not read docker env")
