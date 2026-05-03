import os
import requests
import logging
import asyncio
import sys
import time
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError

# CONFIGURACION
# CONFIGURACION (Priorizar nombres específicos del stack)
API_ID_ENV = os.getenv('TELEGRAM_API_ID') or os.getenv('API_ID')
API_HASH_ENV = os.getenv('TELEGRAM_API_HASH') or os.getenv('API_HASH')
PHONE_ENV = os.getenv('TELEGRAM_PHONE') or os.getenv('PHONE')
TWO_FA_PASSWORD = os.getenv('TELEGRAM_2FA_PASSWORD') or os.getenv('TWO_FA_PASSWORD')
TARGET_CHAT_IDS_RAW = os.getenv('TELEGRAM_TARGET_CHAT_IDS', '')
BANNED_USERNAMES_RAW = os.getenv('TELEGRAM_BANNED_USERNAMES', 'E17PROMOTION_BOT')

if not API_ID_ENV or not API_HASH_ENV:
    raise ValueError("❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment variables")

API_ID = int(API_ID_ENV)
API_HASH = str(API_HASH_ENV)
N8N_WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'http://n8n:5678/webhook/worldmodelsjobs-lead')

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Sesión persistente (montar volumen Docker en /sessions)
session_path = '/sessions/userbot'

def _parse_target_chat_ids(raw: str):
    raw = (raw or '').strip()
    if not raw:
        return None
    parts = [p.strip() for p in raw.split(',') if p.strip()]
    out = set()
    for p in parts:
        try:
            out.add(int(p))
        except Exception:
            continue
    return out if out else None

def _parse_banned_usernames(raw: str):
    raw = (raw or '').strip()
    if not raw:
        return set()
    parts = [p.strip() for p in raw.split(',') if p.strip()]
    return set(p.lower() for p in parts)

async def main():
    logger.info('--- Iniciando Telegram Collector ---')
    
    # IMPORTANTE: Crear el cliente dentro del loop de asyncio
    client = TelegramClient(session_path, API_ID, API_HASH)
    target_chat_ids = _parse_target_chat_ids(TARGET_CHAT_IDS_RAW)
    banned_usernames = _parse_banned_usernames(BANNED_USERNAMES_RAW)

    async def start_client():
        try:
            if PHONE_ENV:
                await client.start(phone=PHONE_ENV)
            else:
                await client.start()
        except SessionPasswordNeededError:
            if not TWO_FA_PASSWORD:
                raise ValueError("❌ Telegram 2FA enabled: set TELEGRAM_2FA_PASSWORD")
            await client.sign_in(password=TWO_FA_PASSWORD)
        except EOFError:
            logger.error('❌ Login requerido pero no hay TTY (EOF).')
            logger.error('➡️  Ejecuta una vez: docker compose run --rm -it telegram-collector python telegram_collector.py')
            while True:
                time.sleep(3600)

    @client.on(events.NewMessage)
    async def my_event_handler(event):
        try:
            msg = getattr(event, 'message', None)
            if msg is not None and getattr(msg, 'media', None) is not None:
                return

            text = (getattr(msg, 'message', None) or event.text or '').strip()
            if not text:
                return

            chat_id = event.chat_id
            if chat_id is None:
                return
            if target_chat_ids is not None and int(chat_id) not in target_chat_ids:
                return

            sender = await event.get_sender()
            sender_id = str(event.sender_id)
            username_raw = getattr(sender, 'username', None)
            username = username_raw or sender_id or 'Desconocido'
            if getattr(sender, 'bot', False):
                return
            if isinstance(username_raw, str) and username_raw.lower().endswith('bot'):
                return
            if isinstance(username_raw, str) and username_raw.lower() in banned_usernames:
                return

            data = {
                'platform': 'telegram',
                'chat_id': chat_id,
                'sender': username,
                'sender_id': sender_id,
                'text': text,
                'date': event.date.isoformat() if event.date else None
            }

            logger.info(f'📨 Enviando mensaje chat_id={chat_id} sender={username} a n8n...')
            
            response = requests.post(N8N_WEBHOOK_URL, json=data, timeout=30)
            logger.info(f'✅ Respuesta n8n: {response.status_code}')

        except Exception as e:
            logger.error(f'❌ Error procesando mensaje: {e}')

    await start_client()
    logger.info('✅ Telegram conectado y escuchando...')
    await client.run_until_disconnected()

if __name__ == '__main__':
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        logger.info('Detenido.')
    except Exception as e:
        logger.info(f'Error fatal: {e}')
