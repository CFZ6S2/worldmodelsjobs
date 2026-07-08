require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { CustomFile } = require('telegram/client/uploads');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID || '');
const apiHash = String(process.env.TELEGRAM_API_HASH || '');
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
const targetGroupIds = ['-1002904509105', '-1002604091536', '-1003705205249'];

if (!apiId || !apiHash) {
    console.error('Missing TELEGRAM_API_ID / TELEGRAM_API_HASH');
    process.exit(1);
}

const sessionString = fs.readFileSync(sessionFile, 'utf8');
const session = new StringSession(sessionString);

const messageText = `¿Cansada de buscar? Deja que las mejores oportunidades lleguen a ti. 🥂
En **WorldModels & Jobs** te damos acceso privado a las ofertas y eventos VIP más exclusivos del momento, directamente en tu móvil y en tiempo real. 

✨ Discreción absoluta.
✨ Plazas internacionales de alto nivel.
✨ Gestión 100% automatizada.

Escríbenos por mensaje privado para conocer los detalles y empezar a recibir tus invitaciones hoy mismo. Plazas limitadas. 💎`;

async function sendAd() {
    console.log('Connecting to Telegram...');
    const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    const imagePath = '/root/worldmodels-jobs/telegram_sniffer/ad.png';

    for (const chatId of targetGroupIds) {
        try {
            console.log(`Sending to ${chatId}...`);
            await client.sendFile(chatId, {
                file: imagePath,
                caption: messageText
            });
            console.log(`Successfully sent to ${chatId}`);
        } catch (error) {
            console.error(`Failed to send to ${chatId}:`, error.message);
        }
    }

    console.log('Done!');
    process.exit(0);
}

sendAd().catch(console.error);
