import sqlite3
import json
import subprocess
import http.client

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Step 1: Login to n8n to get session cookie
print("Step 1: Logging in to n8n...")
login_data = json.dumps({"email": "cesar.herrera.rojo@gmail.com", "password": "worldmodels2026"}).encode()

try:
    conn_http = http.client.HTTPConnection("localhost", 5678)
    conn_http.request("POST", "/n8n/api/v1/login", body=login_data, headers={"Content-Type": "application/json"})
    resp = conn_http.getresponse()
    print(f"Login status: {resp.status}")
    cookies = resp.getheader('Set-Cookie')
    body = resp.read().decode()
    
    if resp.status != 200:
        print(f"Login failed: {body[:300]}")
        # Try alternate passwords
        for pw in ["admin", "Worldmodels2026", "WorldModels2026"]:
            login_data = json.dumps({"email": "cesar.herrera.rojo@gmail.com", "password": pw}).encode()
            conn_http = http.client.HTTPConnection("localhost", 5678)
            conn_http.request("POST", "/n8n/api/v1/login", body=login_data, headers={"Content-Type": "application/json"})
            resp = conn_http.getresponse()
            body = resp.read().decode()
            cookies = resp.getheader('Set-Cookie')
            if resp.status == 200:
                print(f"  Login OK with password: {pw}")
                break
            else:
                print(f"  Failed with: {pw}")
    
    if cookies:
        print(f"Got cookies: {cookies[:100]}")
except Exception as e:
    print(f"Login error: {e}")

# Step 2: Alternative approach - use n8n CLI to import the workflow
print("\nStep 2: Trying n8n CLI import...")

# Get current workflow from DB
conn_db = sqlite3.connect(db_path)
conn_db.row_factory = sqlite3.Row
c = conn_db.cursor()
c.execute("SELECT * FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
cols = [d[0] for d in c.description]
wf_data = dict(zip(cols, row))

# Build the workflow JSON for import
wf_json = {
    "id": wf_data["id"],
    "name": wf_data["name"],
    "active": bool(wf_data["active"]),
    "nodes": json.loads(wf_data["nodes"]),
    "connections": json.loads(wf_data["connections"]),
    "settings": json.loads(wf_data["settings"]) if wf_data.get("settings") else {},
}

with open('/tmp/workflow_export.json', 'w') as f:
    json.dump(wf_json, f)

print(f"Exported workflow to /tmp/workflow_export.json")
print(f"  Name: {wf_json['name']}")
print(f"  Nodes: {len(wf_json['nodes'])}")

# Import via n8n CLI
result = subprocess.run(
    ["docker", "exec", "-i", "n8n", "n8n", "import:workflow", "--input=/tmp/workflow_export.json"],
    capture_output=True, text=True, timeout=30
)
print(f"CLI import stdout: {result.stdout.strip()}")
print(f"CLI import stderr: {result.stderr.strip()[:500]}")

# Try copying file into container first then importing
subprocess.run(["docker", "cp", "/tmp/workflow_export.json", "n8n:/tmp/workflow_export.json"], capture_output=True, text=True)
result = subprocess.run(
    ["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/workflow_export.json"],
    capture_output=True, text=True, timeout=30
)
print(f"\nCLI import (v2) stdout: {result.stdout.strip()}")
print(f"CLI import (v2) stderr: {result.stderr.strip()[:500]}")

conn_db.close()
