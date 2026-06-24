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
    console.log('Conectando a Telegram para iniciar las invitaciones...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('¡Conectado!');

    if (!fs.existsSync(queueFile)) {
        console.log('El archivo de cola no existe. No hay chicas para invitar.');
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
        console.log(`Invitando a un lote de ${chunk.length} usuarias: ${chunk.join(', ')}`);
        
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

    console.log('¡Proceso de invitación completado!');
    await client.disconnect();
    process.exit(0);
})();
