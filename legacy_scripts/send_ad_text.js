require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID || '');
const apiHash = String(process.env.TELEGRAM_API_HASH || '');
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
const targetGroupIds = ['-1002604091536'];

const sessionString = fs.readFileSync(sessionFile, 'utf8');
const session = new StringSession(sessionString);

const messageText = `¿Cansada de buscar? Deja que las mejores oportunidades lleguen a ti. 🥂
En **WorldModels & Jobs** te damos acceso privado a las ofertas y eventos VIP más exclusivos del momento, directamente en tu móvil y en tiempo real. 

✨ Discreción absoluta.
✨ Plazas internacionales de alto nivel.
✨ Gestión 100% automatizada.

Escríbenos por mensaje privado para conocer los detalles y empezar a recibir tus invitaciones hoy mismo. Plazas limitadas. 💎`;

async function sendAd() {
    const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });
    await client.connect();

    for (const chatId of targetGroupIds) {
        try {
            await client.sendMessage(chatId, { message: messageText });
            console.log(`Successfully sent TEXT to ${chatId}`);
        } catch (error) {
            console.error(`Failed to send TEXT to ${chatId}:`, error.message);
        }
    }
    process.exit(0);
}
sendAd().catch(console.error);
