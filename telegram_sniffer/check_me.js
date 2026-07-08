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

(async () => {
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    const me = await client.getMe();
    console.log('My ID is: ' + me.id);
    await client.disconnect();
    process.exit(0);
})();
