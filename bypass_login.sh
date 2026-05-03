#!/bin/bash
cd /root/worldmodels-jobs

# Update .env
if ! grep -q "N8N_USER_MANAGEMENT_DISABLED" .env; then
  echo "N8N_USER_MANAGEMENT_DISABLED=true" >> .env
fi

# Update docker-compose.yml
python3 - <<'PY'
import re
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()
if "N8N_USER_MANAGEMENT_DISABLED" not in s:
    match = re.search(r'(n8n:.*?environment:)(.*?)(\n\s+volumes:)', s, re.DOTALL)
    if match:
        prefix, env_content, suffix = match.groups()
        new_env = env_content + "\n      - N8N_USER_MANAGEMENT_DISABLED=${N8N_USER_MANAGEMENT_DISABLED:-false}"
        s = s.replace(env_content, new_env)
        p.write_text(s)
PY

docker compose up -d
