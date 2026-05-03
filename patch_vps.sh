#!/bin/bash
cd /root/worldmodels-jobs
grep -n "Enviando mensaje" collectors/telegram/telegram_collector.py

python3 - <<'PY'
from pathlib import Path
p = Path("collectors/telegram/telegram_collector.py")
s = p.read_text(encoding="utf-8")

# Asegura fallback cuando username es None y mejora el log
s = s.replace(
    "username = getattr(sender, 'username', 'Desconocido')",
    "username_raw = getattr(sender, 'username', None)\n            username = username_raw or sender_id or 'Desconocido'"
)

s = s.replace(
    "logger.info(f'📨 Enviando mensaje de {username} a n8n...')",
    "logger.info(f'📨 Enviando mensaje chat_id={chat_id} sender={username} a n8n...')"
)

# Ajusta checks de bots para usar username_raw
s = s.replace(
    "if isinstance(username, str) and username.lower().endswith('bot'):",
    "if isinstance(username_raw, str) and username_raw.lower().endswith('bot'):"
)
s = s.replace(
    "if isinstance(username, str) and username.lower() in banned_usernames:",
    "if isinstance(username_raw, str) and username_raw.lower() in banned_usernames:"
)

p.write_text(s, encoding="utf-8")
print("OK patched:", p)
PY

docker compose up -d --build telegram-collector
docker compose restart telegram-collector
docker compose logs -n 40 telegram-collector
docker compose exec -T telegram-collector sh -lc 'echo "$TELEGRAM_TARGET_CHAT_IDS"'
