from telethon import TelegramClient
import os

api_id = 27866843
api_hash = '7e8c5188038965bdc1739fa8c3c0dad7'

client = TelegramClient('/app/sessions/userbot', api_id, api_hash)

async def main():
    print("Iniciando vinculación de Telegram...")
    await client.start()
    print("¡Sesión vinculada con éxito! Ya puedes cerrar esto con Ctrl+C.")

if __name__ == '__main__':
    import asyncio
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
