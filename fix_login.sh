#!/bin/bash
cd /root/worldmodels-jobs

# Update .env
if ! grep -q "N8N_TRUST_PROXY" .env; then
  echo "N8N_TRUST_PROXY=true" >> .env
fi

# Update docker-compose.yml
python3 - <<'PY'
import re
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()
if "N8N_TRUST_PROXY" not in s:
    match = re.search(r'(n8n:.*?environment:)(.*?)(\n\s+volumes:)', s, re.DOTALL)
    if match:
        prefix, env_content, suffix = match.groups()
        new_env = env_content + "\n      - N8N_TRUST_PROXY=${N8N_TRUST_PROXY:-true}"
        s = s.replace(env_content, new_env)
        p.write_text(s)
PY

docker compose up -d
