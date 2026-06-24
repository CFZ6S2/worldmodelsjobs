require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = fs.readFileSync(sessionFile, 'utf8');

const targetChannel = '-1003934906353';

const mockLeads = [
    {
        title: 'Работа в Париже',
        category: 'События',
        city: 'Париж 🇫🇷',
        budget: '1000€ чистыми',
        text: 'Париж\n22-24 апреля\nНужны ТОП-девушки\nНа 2-3 часа.\n1000€ чистыми\nПостоянный клиент',
        contact: '+79633081010'
    },
    {
        title: 'Яхт-вечеринка на Кипре',
        category: 'События',
        city: 'Кипр 🇨🇾',
        budget: 'Договорная',
        text: 'КИПР 🇨🇾 Кто на месте? Пятница + Суббота. Яхт-вечеринка ⛵. Вся информация в ЛС.',
        contact: '+35795667091'
    },
    {
        title: 'Вакансия в Монако',
        category: 'События',
        city: 'Монако 🇲🇨',
        budget: '2000€',
        text: 'Кто свободен на завтра?\n⏳ 2-3 часа\n💰2000€\n\nПостоянный, очень приятный клиент.',
        contact: '+447424169654'
    }
];

(async () => {
    console.log('Conectando a Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    
    console.log('Publicando vacantes reales traducidas al ruso...');
    try {
        for (const lead of mockLeads) {
            const msg = `<b>${lead.title}</b>\n📍 <b>${lead.category}</b>\n🏢 <b>${lead.city}</b>\n💰 <b>${lead.budget}</b>\n\n${lead.text}\n\n📲 <b>Отправитель:</b> ${lead.contact}\n🌐 <b>Источник:</b> WhatsApp`;
            await client.sendMessage(targetChannel, { message: msg, parseMode: 'html' });
            await new Promise(r => setTimeout(r, 2000));
        }
        
        console.log('✅ Vacantes publicadas correctamente.');
    } catch (e) {
        console.log('❌ Error al publicar mensajes:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
