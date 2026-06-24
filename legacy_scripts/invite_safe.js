require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = fs.readFileSync(sessionFile, 'utf8');

const targetChannel = '-1003934906353';
const queueFile = '/root/worldmodels-jobs/telegram_sniffer/models_queue.json';

(async () => {
    console.log('Conectando a Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('¡Conectado!');

    if (!fs.existsSync(queueFile)) {
        console.log('El archivo de cola no existe.');
        process.exit(0);
    }
    
    let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    if (queue.length === 0) {
        console.log('La cola está vacía. Terminando.');
        process.exit(0);
    }

    const batchSize = 15;
    const chunk = queue.slice(0, batchSize);
    let remaining = queue.slice(batchSize);

    console.log(`Invitando a ${chunk.length} usuarios al canal...`);
    let added = 0;
    
    for (const username of chunk) {
        try {
            console.log(`Resolving ${username}...`);
            const result = await client.invoke(new Api.contacts.ResolveUsername({ username }));
            const user = result.users[0];
            
            if (user) {
                console.log(`Inviting ${username}...`);
                await client.invoke(new Api.channels.InviteToChannel({
                    channel: targetChannel,
                    users: [user]
                }));
                added++;
                console.log(`✅ ${username} añadido.`);
            }
        } catch (e) {
            console.log(`❌ Error con ${username}: ${e.message}`);
        }
        // sleep a bit
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`✅ ¡${added} usuarios invitados con éxito!`);
    fs.writeFileSync(queueFile, JSON.stringify(remaining, null, 2));
    console.log(`Quedan ${remaining.length} en la cola.`);

    await client.disconnect();
    process.exit(0);
})();
