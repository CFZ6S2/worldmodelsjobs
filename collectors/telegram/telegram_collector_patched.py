import os
import requests
from telethon import TelegramClient, events
import logging
import asyncio

# CONFIGURACION DINAMICA
# CONFIGURACION DINAMICA
API_ID_ENV = os.getenv('TELEGRAM_API_ID') or os.getenv('API_ID')
API_HASH_ENV = os.getenv('TELEGRAM_API_HASH') or os.getenv('API_HASH')

if not API_ID_ENV or not API_HASH_ENV:
    # We keep hardcoded only for debugging if explicitly allowed, but here we enforce env for safety
    raise ValueError("❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set")

API_ID = int(API_ID_ENV)
API_HASH = str(API_HASH_ENV)

# Intentar cargar variables de entorno (Prioridad: Enorno > Hardcoded)
N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL') or os.getenv('WEBHOOK_URL') or 'http://178.156.186.149:5678/webhook/worldmodels-platinum-v5'
CHECK_DUPLICATE_URL = os.getenv('CHECK_DUPLICATE_URL') or os.getenv('BACKEND_URL') or 'http://localhost:3001/api/check-duplicate'

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Archivo de sesion (Ruta absoluta para PM2)
session_path = '/root/worldmodels-jobs/collectors/telegram/anon.session'
client = TelegramClient(session_path, API_ID, API_HASH)

def has_min_digits(text, min_digits=2):
    return len([char for char in text if char.isdigit()]) >= min_digits

def is_duplicate(text):
    try:
        # Usamos timeout corto para no bloquear el flujo
        r = requests.get(CHECK_DUPLICATE_URL, params={'text': text}, timeout=3)
        if r.status_code == 200:
            return r.json().get('duplicate', False)
    except Exception as e:
        logger.error(f'Error checking duplicate (Guardia dormido?): {e}')
    return False

@client.on(events.NewMessage)
async def my_event_handler(event):
    text = event.text or ''
    if not text:
        return

    try:
        # 1. Filtro de Longitud (Mínimo 50 caracteres)
        if len(text) < 50:
            logger.info(f'Mensaje ignorado (muy corto: {len(text)} chars)')
            return

        # 2. Filtro Numerico (Mínimo 2 números)
        if not has_min_digits(text, 2):
            logger.info(f'Mensaje ignorado (pocos numeros)')
            return

        # 3. Filtro de Duplicados (Llamada al Guardia en 3001)
        if is_duplicate(text):
            logger.info(f'Mensaje ignorado (DUPLICADO)')
            return

        sender = await event.get_sender()
        username = getattr(sender, 'username', 'Desconocido')
        
        data = {
            'platform': 'telegram',
            'chat_id': event.chat_id,
            'sender': username,
            'text': text,
            'date': event.date.isoformat() if event.date else None
        }
        
        logger.info(f'Enviando lead de {username} a n8n (60s timeout)...')
        # POST a n8n (Platinum V5)
        response = requests.post(N8N_WEBHOOK_URL, json=data, timeout=60)
        logger.info(f'Respuesta n8n: {response.status_code}')
        
    except Exception as e:
        logger.error(f'Error procesando mensaje: {e}')

async def main():
    logger.info('--- PLATINUM V5: Iniciando Telegram Collector ---')
    await client.start()
    logger.info('✅ Telegram escuchando y filtrando activamente en ruta: ' + N8N_WEBHOOK_URL)
    await client.run_until_disconnected()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info('Detenido.')
    except Exception as e:
        logger.error(f'Error fatal: {e}')
