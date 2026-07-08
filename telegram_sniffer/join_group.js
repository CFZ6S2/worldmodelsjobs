require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = '';
if (fs.existsSync(sessionFile)) {
    sessionString = fs.readFileSync(sessionFile, 'utf8');
}

(async () => {
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected to Telegram.');
    
    try {
        // The hash is the part after https://t.me/+
        const hash = 'oCa0K-NmHNcyMjRh';
        await client.invoke(new Api.messages.ImportChatInvite({
            hash: hash
        }));
        console.log('Successfully joined the group!');
    } catch (e) {
        // If already in group, it might throw an error saying User already a participant
        console.error('Result:', e.message);
    }
    
    await client.disconnect();
    process.exit(0);
})();
