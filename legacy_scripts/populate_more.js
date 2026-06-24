require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = fs.readFileSync(sessionFile, 'utf8');

const targetChannel = '-1003934906353';

const moreLeads = [
    {
        title: 'Встреча в Эр-Рияде 🇸🇦',
        category: 'События',
        city: 'Эр-Рияд 🇸🇦',
        budget: 'По запросу',
        text: 'Эр-Рияд 🇸🇦\nВстреча с VIP арабским клиентом\nКто сейчас там?',
        contact: '+491634633110'
    },
    {
        title: 'Модели NYC Сегодня вечером 🇺🇸',
        category: 'События',
        city: 'Нью-Йорк 🇺🇸',
        budget: '1500$ чистыми',
        text: 'NYC 🇺🇸\nСегодня вечером — в 20:00\n1 час 2500$ - модель получает 1500$✨\nПрисылайте свои фото и видео.',
        contact: '+16099372540'
    },
    {
        title: 'Вечеринка на вилле в Испании 🇪🇸',
        category: 'События',
        city: 'Испания 🇪🇸',
        budget: 'Договорная',
        text: 'Испания 🇪🇸\nСкоро - даты открыты. Постоянный клиент, очень приятный мужчина.',
        contact: '+380937712321'
    },
    {
        title: 'Славянские девушки Барселона',
        category: 'Вакансии',
        city: 'Барселона 🇪🇸',
        budget: 'Договорная',
        text: '❗️Кто в БАРСЕЛОНЕ или готов к перелету по Европе❓❗️\n❗️Предпочтительно украинки и славянские лица',
        contact: '+380684095162'
    },
    {
        title: 'VIP Вечеринки Лондон 🇬🇧',
        category: 'События',
        city: 'Лондон 🇬🇧',
        budget: 'Высокий',
        text: '💎🔹 ХОРОШИЕ ВЕЧЕРИНКИ И АВТЕРПАТИ В ЛОНДОНЕ 🔹💎\nСвяжитесь для получения дополнительной информации.',
        contact: '+447877768537'
    },
    {
        title: 'Лос-Анджелес Срочно 🇺🇸',
        category: 'Вакансии',
        city: 'Лондон 🇬🇧',
        budget: '1500$ чистыми',
        text: 'Встреча в Лос-Анджелесе в следующий вторник\nВыезд в ОС\n2 часа 1500$ чистыми\nUber оплачивается\nВозможно повышение для супер-топ моделей',
        contact: 'Через администратора'
    }
];

(async () => {
    console.log('Conectando a Telegram para publicar más leads...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    
    console.log('Publicando 6 vacantes nuevas traducidas al ruso...');
    try {
        for (const lead of moreLeads) {
            const msg = `<b>${lead.title}</b>\n📍 <b>${lead.category}</b>\n🏢 <b>${lead.city}</b>\n💰 <b>${lead.budget}</b>\n\n${lead.text}\n\n📲 <b>Отправитель:</b> ${lead.contact}\n🌐 <b>Источник:</b> WhatsApp/Telegram`;
            await client.sendMessage(targetChannel, { message: msg, parseMode: 'html' });
            await new Promise(r => setTimeout(r, 2500)); // Pause to avoid flood
        }
        
        console.log('✅ Más vacantes publicadas correctamente.');
    } catch (e) {
        console.log('❌ Error al publicar mensajes:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
