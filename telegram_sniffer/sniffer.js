const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const input = require('input');
const fetch = require('node-fetch');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID || '');
const apiHash = String(process.env.TELEGRAM_API_HASH || '');
const phoneNumber = String(process.env.TELEGRAM_PHONE || '');
const sessionFile = String(process.env.TELEGRAM_SESSION_FILE || '/root/worldmodels-jobs/telegram_sniffer/session.txt');
const targetGroupIds = String(process.env.TELEGRAM_TARGET_GROUP_IDS || '-1002904509105,-1002604091536,-1003705205249')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const N8N_WEBHOOK_URL = String(process.env.N8N_WEBHOOK_URL || 'http://178.156.186.149/webhook/telegram-wm-2024');

if (!apiId || !apiHash || !phoneNumber) {
    console.error('Missing TELEGRAM_API_ID / TELEGRAM_API_HASH / TELEGRAM_PHONE');
    process.exit(1);
}

let sessionString = '';
if (fs.existsSync(sessionFile)) {
    sessionString = fs.readFileSync(sessionFile, 'utf8');
}

const session = new StringSession(sessionString);

async function start() {
    console.log('--- WorldModels Telegram DIRECT Sniffer ---');
    const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

    await client.start({
        phoneNumber: async () => phoneNumber,
        phoneCode: async () => await input.text('Code: '),
        onError: (err) => console.log(err),
    });

    console.log('Connected to Telegram!');
    fs.writeFileSync(sessionFile, client.session.save());

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (!message || !message.text) return;

        const text = message.text;
        const chatId = message.chatId ? message.chatId.toString() : '';

        // Solo grupos objetivo
        if (!targetGroupIds.includes(chatId)) return;
        console.log('--------------------------------');
        console.log('INCOMING MSG | ChatID:', chatId);
        console.log('Text:', text.substring(0, 60).replace(/\n/g, ' '));
        console.log('TARGET GROUP MATCH!');

        const sender = await message.getSender();
        
        // ¡BLOQUEO DE BOTS!
        if (sender && sender.bot) {
            console.log('SKIP: Es un Bot Oficial');
            return;
        }
        if (sender && sender.username && sender.username.toLowerCase().endsWith('bot')) {
            console.log('SKIP: El username termina en bot');
            return;
        }

        let tmeLink = '';
        if (sender && sender.username) {
            tmeLink = 't.me/' + sender.username;
        } else if (sender && sender.id) {
            tmeLink = 'tg_id_' + sender.id.toString();
        } else {
            console.log('SKIP: No sender info');
            return;
        }

        console.log('LEAD QUALIFIED:', tmeLink);

        // Payload directo al n8n webhook
        const payload = {
            platform: 'telegram',
            from: tmeLink,
            sender: tmeLink,
            chatId: chatId,
            remoteJid: chatId + '@g.us',
            isGroup: true,
            text: text,
            contact: tmeLink,
            whatsapp: tmeLink,
            source: 'telegram_sniffer',
            pushName: ((sender ? sender.firstName || '' : '') + ' ' + (sender ? sender.lastName || '' : '')).trim(),
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            console.log('Sent to N8N:', res.status, JSON.stringify(data));
        } catch (err) {
            console.log('ERROR sending to backend:', err.message);
        }
        console.log('--------------------------------');

    }, new NewMessage({}));

    console.log('Listening for messages...');
    await new Promise(() => {});
}

start().catch(console.error);
