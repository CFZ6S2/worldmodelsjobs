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
    
    console.log('Fetching dialogs to populate cache...');
    await client.getDialogs({ limit: undefined }); // Fetch all
    
    try {
        console.log('Trying to message Telele...');
        await client.sendMessage('8499810866', { message: '/start' });
        console.log('Success! Telele is cached.');
    } catch (e) {
        console.error('Still failed:', e.message);
    }
    
    await client.disconnect();
    process.exit(0);
})();
