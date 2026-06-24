require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = '';
if (fs.existsSync(sessionFile)) {
    sessionString = fs.readFileSync(sessionFile, 'utf8');
}

const targetGroup = '-1001380548433';

(async () => {
    console.log('Connecting to Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    console.log(`Fetching last 2000 messages from ${targetGroup}...`);
    try {
        const messages = await client.getMessages(targetGroup, { limit: 2000 });
        console.log(`Fetched ${messages.length} messages.`);

        const models = new Set();

        const keywords = ['рост', 'вес', 'грудь', 'лет', 'года', 'параметры'];

        for (const msg of messages) {
            if (msg.message && msg.senderId) {
                const text = msg.message.toLowerCase();
                const matches = keywords.filter(kw => text.includes(kw));
                
                // If it matches at least two keywords (e.g. age and height), it's likely a model profile
                if (matches.length >= 2) {
                    const sender = await msg.getSender();
                    if (sender && sender.username) {
                        models.add(sender.username);
                    }
                }
            }
        }

        console.log(`\n=== FOUND ${models.size} REAL MODELS ===`);
        for (const username of models) {
            console.log(`@${username}`);
        }
        console.log('==================================');

    } catch (e) {
        console.error('Error fetching messages:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
