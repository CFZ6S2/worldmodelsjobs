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

const mockLeads = [
    {
        title: '👑 VIP Экскорт Туры (Дубай / Европа)',
        category: 'Вакансии',
        city: 'Дубай, Монако, Париж',
        budget: 'От 2,000$ в день',
        text: 'Требуются привлекательные девушки модельной внешности для участия в VIP-турах и частных мероприятиях. Проживание в 5-звездочных отелях, перелет оплачивается. Полная конфиденциальность и безопасность гарантированы.\n\nТребования: ухоженный вид, возраст 18-28 лет, базовое знание английского приветствуется.'
    },
    {
        title: '📸 Модельные Кастинги и Фотосессии',
        category: 'События',
        city: 'Ибица / Канны',
        budget: '500$ - 1500$ за съемку',
        text: 'Ищем новые лица для съемок брендовой одежды и участия в промо-вечеринках на Ибице и Лазурном Берегу. Отличная возможность для старта карьеры и полезных знакомств.'
    }
];

(async () => {
    console.log('Conectando a Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('¡Conectado! Refrescando caché de canales...');

    // Fetch dialogs to update entity cache
    await client.getDialogs({});
    console.log('Caché refrescada.');

    console.log('Publicando vacantes genéricas en ruso...');
    try {
        for (const lead of mockLeads) {
            const msg = `<b>${lead.title}</b>\n📍 <b>${lead.category}</b>\n🏢 <b>${lead.city}</b>\n💰 <b>${lead.budget}</b>\n\n${lead.text}\n\n📲 <b>Контакт:</b> Связь через администратора`;
            await client.sendMessage(targetChannel, { message: msg, parseMode: 'html' });
            await new Promise(r => setTimeout(r, 2000));
        }
        
        // Mensaje promocional para el canal voluntario
        const promoMsg = `🌟 <b>ДОБРО ПОЖАЛОВАТЬ В WORLDMODELS VIP</b> 🌟\n\nДля доступа к закрытым вакансиям, турам и приватным приглашениям обращайтесь к нашему администратору или следите за обновлениями в нашем основном канале.\n\n🔥 <i>Самые свежие VIP-предложения со всего мира!</i>`;
        await client.sendMessage(targetChannel, { message: promoMsg, parseMode: 'html' });
        console.log('Vacantes publicadas correctamente.');
    } catch (e) {
        console.log('❌ Error al publicar mensajes:', e.message);
        process.exit(1);
    }

    // 3. Invite users
    if (!fs.existsSync(queueFile)) {
        console.log('El archivo de cola no existe.');
        process.exit(0);
    }
    
    let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    if (queue.length === 0) {
        console.log('La cola está vacía. Terminando.');
        process.exit(0);
    }

    console.log(`\nIniciando invitaciones masivas... Total a invitar: ${queue.length}`);
    const batchSize = 15;
    
    while (queue.length > 0) {
        const chunk = queue.slice(0, batchSize);
        console.log(`Invitando a un lote de ${chunk.length} usuarias...`);
        
        try {
            await client.invoke(new Api.channels.InviteToChannel({
                channel: targetChannel,
                users: chunk
            }));
            console.log(`✅ ¡Lote invitado con éxito!`);
        } catch (e) {
            console.error('❌ Error al invitar este lote:', e.message);
            if (e.message.includes('FLOOD')) {
                console.log('⚠️ Detectado límite por FLOOD. Deteniendo script para evitar baneos.');
                break;
            }
        }

        queue = queue.slice(batchSize);
        fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
        
        if (queue.length > 0) {
            console.log(`Quedan ${queue.length} chicas. Esperando 10 segundos antes del siguiente lote...`);
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log('¡Proceso completado!');
    await client.disconnect();
    process.exit(0);
})();
