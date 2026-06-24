require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const admin = require('firebase-admin');

// 1. Firebase setup
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'worldmodels-jobs'
  });
}
const db = admin.firestore();

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

    // 2. Fetch recent Russian leads from Firebase
    console.log('Buscando leads en Firebase con text_ru...');
    const snapshot = await db.collection('leads')
        .where('text_ru', '!=', '')
        .orderBy('text_ru')
        .limit(20)
        .get();

    let leads = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.category === 'plaza' || data.category === 'evento') {
            leads.push(data);
        }
    });
    
    leads.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    const topLeads = leads.slice(0, 4);
    
    if (topLeads.length === 0) {
        console.log('No se encontraron leads rusos.');
    } else {
        console.log(`Encontrados ${topLeads.length} leads rusos. Publicando en el canal...`);
        for (const lead of topLeads) {
            const title = lead.title_ru || 'Новая Вакансия';
            const city = lead.city || 'Неизвестно';
            const budget = lead.budget || 'Договорная';
            const text = (lead.text_ru || '').substring(0, 800);
            const categoryStr = lead.category === 'plaza' ? 'Вакансии' : 'События';
            
            const msg = `<b>${title}</b>\n📍 <b>${categoryStr}</b>\n🏢 <b>${city}</b>\n💰 <b>${budget}</b>\n\n${text}\n\n📲 <b>Контакт:</b> Связь через администратора`;
            
            await client.sendMessage(targetChannel, { message: msg, parseMode: 'html' });
            await new Promise(r => setTimeout(r, 2000));
        }
        console.log('Leads publicados correctamente.');
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

    // Para evitar baneos, añadimos en tandas de 10-15 por ejecución.
    const batchSize = 15;
    const chunk = queue.slice(0, batchSize);
    const remaining = queue.slice(batchSize);

    console.log(`Invitando a ${chunk.length} usuarios al canal...`);
    try {
        await client.invoke(new Api.channels.InviteToChannel({
            channel: targetChannel,
            users: chunk
        }));
        console.log(`✅ ¡${chunk.length} usuarios invitados con éxito!`);
        
        fs.writeFileSync(queueFile, JSON.stringify(remaining, null, 2));
        console.log(`Quedan ${remaining.length} en la cola.`);
    } catch (e) {
        console.error('❌ Error al invitar usuarios:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
