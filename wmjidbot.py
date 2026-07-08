import requests
import time
import json

TOKEN = '8614999463:AAFHjotn5J5olkBXiJCY9x6FSR-qKiKDiF4'
VPS_CALLBACK = 'http://127.0.0.1:3001/api/registro/tg-callback'
API = f'https://api.telegram.org/bot{TOKEN}'

def send(chat_id, text):
    requests.post(f'{API}/sendMessage', json={'chat_id': chat_id, 'text': text}, timeout=10)

def get_updates(offset):
    try:
        r = requests.get(f'{API}/getUpdates', params={'offset': offset, 'timeout': 30, 'allowed_updates': ['message']}, timeout=35)
        return r.json().get('result', [])
    except:
        return []

def main():
    print('WMJIDBOT started')
    offset = 0
    while True:
        updates = get_updates(offset)
        for u in updates:
            offset = u['update_id'] + 1
            msg = u.get('message', {})
            if not msg:
                continue
            chat_id = msg['chat']['id']
            text = msg.get('text', '')
            user = msg.get('from', {})
            username = user.get('username', '')

            if text.startswith('/start'):
                parts = text.split(' ', 1)
                reg_token = parts[1].strip() if len(parts) > 1 else ''

                tg_contact = f'@{username}' if username else str(chat_id)
                reply = f'Tu ID de Telegram es: {tg_contact}\n\nYa puedes volver a la pagina de registro, se rellenara automaticamente.'
                send(chat_id, reply)

                if reg_token:
                    try:
                        requests.post(VPS_CALLBACK, json={'token': reg_token, 'tg_id': tg_contact}, timeout=5)
                    except:
                        pass

        time.sleep(1)

if __name__ == '__main__':
    while True:
        try:
            main()
        except Exception as e:
            print(f'Bot error: {e}')
            time.sleep(5)
