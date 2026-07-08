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

const targetGroup = '-1003920309636';
const queueFile = '/root/worldmodels-jobs/telegram_sniffer/models_queue.json';

(async () => {
    if (!fs.existsSync(queueFile)) {
        console.log('No queue file found.');
        process.exit(0);
    }
    
    let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    if (queue.length === 0) {
        console.log('Queue is empty. Done.');
        process.exit(0);
    }

    const chunk = queue.slice(0, 5);
    const remaining = queue.slice(5);

    console.log('Connecting to Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    console.log('Inviting ' + chunk.length + ' users: ' + chunk.join(', '));
    try {
        const targetEntity = await client.getEntity(targetGroup);
        await client.invoke(new Api.channels.InviteToChannel({
            channel: targetEntity,
            users: chunk
        }));
        console.log('Successfully invited batch.');
        
        // Update queue only on success
        fs.writeFileSync(queueFile, JSON.stringify(remaining, null, 2));
        console.log('Remaining in queue: ' + remaining.length);
    } catch (e) {
        console.error('Failed to invite users:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
