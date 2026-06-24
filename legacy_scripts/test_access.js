require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = fs.readFileSync(sessionFile, 'utf8');

const targetChannel = '-1003934906353';

(async () => {
    console.log('Conectando a Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    
    // Check who am I
    const me = await client.getMe();
    console.log(`Logueado como: ${me.username || me.firstName} (ID: ${me.id})`);

    try {
        const result = await client.invoke(new Api.channels.GetChannels({
            id: [targetChannel]
        }));
        console.log('✅ El usuario tiene acceso al canal:', result.chats[0].title);
    } catch (e) {
        console.error('❌ El usuario NO tiene acceso al canal:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
