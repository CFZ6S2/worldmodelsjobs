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
    console.log('Connecting to Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    const dialogs = await client.getDialogs();
    console.log('\n--- GROUPS THIS ACCOUNT IS IN ---');
    for (const dialog of dialogs) {
        if (dialog.isGroup || dialog.isChannel) {
            console.log('Name: ' + dialog.title + ' | ID: ' + dialog.entity.id);
        }
    }
    
    await client.disconnect();
    process.exit(0);
})();
