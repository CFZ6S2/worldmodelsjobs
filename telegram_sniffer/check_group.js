const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = 32882215;
const apiHash = 'de7fb1c1ec1a0c5b782ffaed8335ace4';
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
const sessionString = fs.readFileSync(sessionFile, 'utf8');
const session = new StringSession(sessionString);
const targetId = '-1002604091536';

(async () => {
    const client = new TelegramClient(session, apiId, apiHash, {});
    await client.connect();
    try {
        const entity = await client.getEntity(targetId);
        console.log('--- GROUP INFO ---');
        console.log('Title: ' + entity.title);
        console.log('ID: ' + entity.id);
        console.log('Username: ' + (entity.username || 'No public username'));
    } catch (e) {
        console.log('Could not find group info: ' + e.message);
    }
    await client.disconnect();
})();
