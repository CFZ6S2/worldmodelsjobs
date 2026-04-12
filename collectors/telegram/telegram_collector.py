import os
import requests
import logging
import asyncio
from telethon import TelegramClient, events

# CONFIGURACION
API_ID = int(os.getenv('API_ID', 27866843))
API_HASH = os.getenv('API_HASH', '7e8c5188038965bdc1739fa8c3c0dad7')
N8N_WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'http://n8n:5678/webhook/worldmodelsjobs-lead')

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Sesion
session_path = '/app/anon'

async def main():
    logger.info('--- Iniciando Telegram Collector ---')
    
    # IMPORTANTE: Crear el cliente dentro del loop de asyncio
    client = TelegramClient(session_path, API_ID, API_HASH)

    @client.on(events.NewMessage)
    async def my_event_handler(event):
        text = event.text or ''
        if not text:
            return

        try:
            sender = await event.get_sender()
            username = getattr(sender, 'username', 'Desconocido')
            sender_id = str(event.sender_id)

            data = {
                'platform': 'telegram',
                'chat_id': event.chat_id,
                'sender': username,
                'sender_id': sender_id,
                'text': text,
                'date': event.date.isoformat() if event.date else None
            }

            logger.info(f'📨 Enviando mensaje de {username} a n8n...')
            
            response = requests.post(N8N_WEBHOOK_URL, json=data, timeout=30)
            logger.info(f'✅ Respuesta n8n: {response.status_code}')

        except Exception as e:
            logger.error(f'❌ Error procesando mensaje: {e}')

    await client.start()
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
