#!/bin/bash
set -euo pipefail

# 1) Adjust Nginx
cat << 'EOF' > /etc/nginx/sites-enabled/worldmodels-jobs
server {
  listen 80;
  server_name 178.156.186.149;
  client_max_body_size 50M;

  location = / {
    return 200 "OK\n";
    add_header Content-Type text/plain;
  }

  location = /n8n { return 301 /n8n/; }

  location ^~ /n8n/ {
    proxy_pass http://127.0.0.1:5678/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /n8n;
  }
}
EOF

nginx -t
systemctl reload nginx

# 2) Adjust .env
cd /root/worldmodels-jobs
python3 - <<'PY'
from pathlib import Path
p = Path(".env")
lines = p.read_text().splitlines()
new_lines = []
keys_to_add = {
    "N8N_HOST": "178.156.186.149",
    "N8N_PROTOCOL": "http",
    "N8N_PATH": "/n8n/",
    "WEBHOOK_URL": "http://178.156.186.149/n8n/",
    "N8N_EDITOR_BASE_URL": "http://178.156.186.149/n8n/"
}
processed_keys = set()
for line in lines:
    if "=" in line:
        key = line.split("=")[0].strip()
        if key in keys_to_add:
            new_lines.append(f"{key}={keys_to_add[key]}")
            processed_keys.add(key)
            continue
    new_lines.append(line)

for key, val in keys_to_add.items():
    if key not in processed_keys:
        new_lines.append(f"{key}={val}")

p.write_text("\n".join(new_lines) + "\n")
print(".env updated")
PY

# 3) Adjust docker-compose.yml
python3 - <<'PY'
import re
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()

# Add missing env vars to n8n service
n8n_env_section = re.search(r'container_name: n8n\n    restart: always\n    ports:.*?\n    environment:(.*?)\n    volumes:', s, re.DOTALL)
if n8n_env_section:
    env_content = n8n_env_section.group(1)
    missing = [
        "- N8N_PROTOCOL=${N8N_PROTOCOL:-http}",
        "- N8N_PATH=${N8N_PATH}",
        "- WEBHOOK_URL=${WEBHOOK_URL}",
        "- N8N_EDITOR_BASE_URL=${N8N_EDITOR_BASE_URL}"
    ]
    for m in missing:
        if m not in env_content:
            s = s.replace(env_content, env_content + f"\n      {m}")

# Update telegram-collector webhook
s = s.replace("WEBHOOK_URL=http://n8n:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef", 
              "WEBHOOK_URL=http://n8n:5678/n8n/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef")

p.write_text(s)
print("docker-compose.yml updated")
PY

# 4) Restart
docker compose up -d
docker compose restart n8n
docker compose restart telegram-collector

# 5) Verify
echo "Verifying..."
curl -I http://127.0.0.1/n8n/ | head -n 5
