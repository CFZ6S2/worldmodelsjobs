import os
import re
import requests
import asyncio
import logging
from telethon import TelegramClient, events
from dotenv import load_dotenv

# Setup Logging
log_file = "telegram_sniffer.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load env file
load_dotenv(".env")

# Configuration from environment
API_ID = os.getenv('TELEGRAM_API_ID', '27866843')
API_HASH = os.getenv('TELEGRAM_API_HASH', '7e8c5188038965bdc1739fa8c3c0dad7')
N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL', 'http://178.156.186.149:5678/webhook/worldmodels-platinum-v5')
SESSION_NAME = 'euromodel_prod_v3'

if not API_ID or not API_HASH:
    logger.error("TELEGRAM_API_ID and TELEGRAM_API_HASH are required.")
    exit(1)
if '127.' in str(N8N_WEBHOOK_URL):
    logger.error("N8N_WEBHOOK_URL cannot use 127.0.0.0/8")
    exit(1)

# Filtering logic (same as WhatsApp bot)
MIN_LENGTH = 50
BANNED_KEYWORDS = ['cambio', 'gratis', 'paja']

def should_process_message(text):
    if not text or not isinstance(text, str):
        return False, "Empty or invalid message"
    
    # Check length
    if len(text) < MIN_LENGTH:
        return False, f"Too short ({len(text)} chars)"
    
    # Check for digits
    if not any(char.isdigit() for char in str(text)):
        return False, "No digits found"
    
    # Check for banned keywords
    lower_text = str(text).lower()
    for word in BANNED_KEYWORDS:
        if word in lower_text:
            return False, f"Banned keyword found: {word}"
            
    return True, "Passed filtering"

async def main():
    logger.info("Starting Telegram Sniffer...")
    
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    
    @client.on(events.NewMessage)
    async def handler(event):
        # We only care about messages in groups/channels or specific chats
        # For now, let's process all incoming messages that the user can see
        
        text = event.message.message
        sender = await event.get_sender()
        sender_id = str(event.sender_id)
        
        # Determine a display name
        sender_name = "Unknown"
        if sender:
            first_name = getattr(sender, 'first_name', '') or ''
            last_name = getattr(sender, 'last_name', '') or ''
            sender_name = (first_name + " " + last_name).strip()
            if not sender_name:
                sender_name = getattr(sender, 'username', None) or sender_id

        is_valid, reason = should_process_message(text)
        
        if is_valid:
            logger.info(f"Forwarding message from {sender_name} ({sender_id})")
            payload = {
                "source": "telegram",
                "sender": sender_id,
                "sender_name": sender_name,
                "text": text,
                "timestamp": event.message.date.isoformat()
            }
            
            try:
                # Forward to n8n
                requests.post(N8N_WEBHOOK_URL, json=payload, timeout=10)
            except Exception as e:
                logger.error(f"Error forwarding to n8n: {e}")
        else:
            # Optional: log filtered messages for debugging
            # print(f"Filtered message from {sender_name}: {reason}")
            pass

    await client.start()
    logger.info("Telegram Sniffer is running. Live logs in telegram_sniffer.log")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
