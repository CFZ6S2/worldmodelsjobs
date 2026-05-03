#!/bin/bash
cd /root/worldmodels-jobs

# Update .env with explicit values
sed -i 's/N8N_TRUST_PROXY=true/N8N_TRUST_PROXY=1/g' .env
if ! grep -q "N8N_LOG_LEVEL" .env; then
  echo "N8N_LOG_LEVEL=debug" >> .env
fi

# Update docker-compose.yml to ensure N8N_TRUST_PROXY is passed correctly
python3 - <<'PY'
import re
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()
# Ensure N8N_TRUST_PROXY uses the env var and defaults to 1
s = s.replace('N8N_TRUST_PROXY=${N8N_TRUST_PROXY:-true}', 'N8N_TRUST_PROXY=${N8N_TRUST_PROXY:-1}')
# Ensure N8N_LOG_LEVEL is passed
if "N8N_LOG_LEVEL" not in s:
    match = re.search(r'(n8n:.*?environment:)(.*?)(\n\s+volumes:)', s, re.DOTALL)
    if match:
        prefix, env_content, suffix = match.groups()
        new_env = env_content + "\n      - N8N_LOG_LEVEL=${N8N_LOG_LEVEL:-info}"
        s = s.replace(env_content, new_env)
p.write_text(s)
PY

docker compose up -d
docker compose restart n8n
