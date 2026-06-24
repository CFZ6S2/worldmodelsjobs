require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
const sessionString = fs.readFileSync(sessionFile, 'utf8').trim();

const targetGroup = '-1001689881186';
const teleleBot = '8499810866'; // Telele bot ID
const delayMs = 10000; // 10 segundos para no saturar al bot

const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log('🔄 Conectando a Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('✅ ¡Conectado!');

    console.log('🔄 Sincronizando diálogos para encontrar a TeleleBot...');
    await client.getDialogs({ limit: undefined });

    console.log(`🔍 Extrayendo participantes de ${targetGroup}...`);
    try {
        const participants = await client.getParticipants(targetGroup, { limit: 5000 });
        
        // Filtramos online/recientemente y que tengan USERNAME (Telele lo necesita)
        const validUsers = participants.filter(user => {
            if (user.bot || user.deleted || !user.username) return false;
            if (user.status) {
                return user.status.className === 'UserStatusOnline' || user.status.className === 'UserStatusRecently';
            }
            return false;
        });

        console.log(`🎯 Encontrados ${validUsers.length} usuarios activos CON username.`);
        console.log(`🚀 Iniciando comprobación en Telele (1 cada 10 segundos)...`);

        try {
            await client.sendMessage(teleleBot, { message: '/start' });
            await sleep(2000);
        } catch (e) {}

        const realModels = [];
        const botModels = [];

        for (let i = 0; i < validUsers.length; i++) {
            const username = validUsers[i].username;
            console.log(`\n[${i + 1}/${validUsers.length}] Analizando @${username}...`);
            
            try {
                await client.sendMessage(teleleBot, { message: `https://t.me/${username}` });
                
                await sleep(5000); // Darle tiempo a Telele para responder
                
                const replies = await client.getMessages(teleleBot, { limit: 3 });
                let botReply = replies.find(r => r.senderId && r.senderId.toString() === teleleBot && r.message && r.message.includes('Message diversity'));
                
                if (botReply) {
                    const text = botReply.message;
                    
                    let diversity = 100;
                    const divMatch = text.match(/diversity ([\d.]+)%/);
                    if (divMatch) diversity = parseFloat(divMatch[1]);
                    
                    let groupsCount = 0;
                    const groupMatch = text.match(/in (\d+) groups/);
                    if (groupMatch) groupsCount = parseInt(groupMatch[1]);

                    console.log(`   -> Diversity (Porcentaje): ${diversity}%, Groups: ${groupsCount}`);
                    
                    if (diversity < 2.0 || groupsCount > 30) {
                        console.log('   ❌ Rechazado: Es un bot o spammer.');
                        botModels.push(username);
                    } else {
                        console.log('   ✅ Aceptado: Parece real.');
                        realModels.push(username);
                        // Escribirlo en un archivo para guardarlo
                        fs.appendFileSync('/root/worldmodels-jobs/telele_verificados.txt', `@${username}\n`);
                    }
                } else {
                    console.log('   ⚠️ Sin respuesta de Telele o respuesta inválida.');
                }
            } catch (err) {
                console.log(`   ❌ Error al enviar a Telele: ${err.message}`);
            }
            
            // Esperar el resto del ciclo de 10 segundos
            await sleep(5000); 
        }

        console.log('\n=== RESULTADO FINAL ===');
        console.log(`✅ Reales: ${realModels.length}`);
        console.log(`❌ Bots descartados: ${botModels.length}`);
        console.log(`Los buenos se han guardado en telele_verificados.txt`);

    } catch (e) {
        console.error('Error crítico:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
