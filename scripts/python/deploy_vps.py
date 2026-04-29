import paramiko
import os
import sys
import time
import requests

# --- CONFIGURACIÓN DEL VPS ---
VPS_HOST = "178.156.186.149"
VPS_USER = "root"
VPS_PASSWORD = os.getenv("VPS_PASSWORD", "") 
REMOTE_PATH = "/root/worldmodels-jobs/"

def deploy():
    print(f"[*] Starting deployment on {VPS_HOST}...")
    
    try:
        # 1. Connection
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print(f"[+] Connecting to {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, username=VPS_USER, password=VPS_PASSWORD)
        
        # 2. Update commands
        commands = [
            f"cd {REMOTE_PATH} && git pull origin main",
            f"cd {REMOTE_PATH} && npm install",
            "pm2 restart worldmodels-backend",
            "pm2 restart tg-sniffer"
        ]
        
        for cmd in commands:
            print(f"[>] Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.read(); stderr.read() # Wait for completion

        # 3. Post-Restart Health Validation
        print("[!] Waiting for services to stabilize (10s)...")
        time.sleep(10)
        
        health_url = f"http://{VPS_HOST}:3001/api/health/full"
        print(f"[?] Verifying health at: {health_url}")
        
        try:
            resp = requests.get(health_url, timeout=15)
            if resp.status_code == 200:
                stats = resp.json()
                print(f"[OK] HEALTH OK: Status={stats['status']}, Leads 24h={stats['recent_leads_24h']}")
            else:
                print(f"[WARN] Attention: Server responded with status {resp.status_code}")
        except Exception as ve:
            print(f"[ERROR] VALIDATION FAILED: Server not responding after restart. {ve}")

        client.close()
        print("\n[SUCCESS] Deployment process finished.")
        
    except Exception as e:
        print(f"\n❌ Error durante el despliegue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    deploy()
