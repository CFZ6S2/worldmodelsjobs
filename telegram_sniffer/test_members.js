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
    
    try {
        const participants = await client.getParticipants('-1002507184558', { limit: 10 });
        console.log('Successfully fetched participants. Count: ' + participants.length);
        for(let i=0; i<3; i++) {
            if(participants[i]) console.log(participants[i].username || participants[i].id);
        }
    } catch (e) {
        console.error('Failed to fetch participants:', e.message);
    }
    
    await client.disconnect();
    process.exit(0);
})();
