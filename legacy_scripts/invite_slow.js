require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
const sessionString = fs.readFileSync(sessionFile, 'utf8').trim();

const sourceGroup = '-1001689881186';
const targetChannel = '-1003934906353';
const delayMs = 10000; // 10 segundos

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  console.log('✅ Conectado a Telegram (El Telele).');

  try {
    console.log('🔍 Extrayendo usuarios del grupo origen...');
    const participants = await client.getParticipants(sourceGroup, { limit: 5000 });
    
    // Filtrar los buenos (Online o Recently)
    const validUsers = participants.filter(user => {
      if (user.bot || user.deleted) return false;
      if (user.status) {
        return user.status.className === 'UserStatusOnline' || user.status.className === 'UserStatusRecently';
      }
      return false;
    });

    console.log(`🎯 Se han filtrado ${validUsers.length} usuarios "buenos".`);
    console.log(`🚀 Empezando a invitarlos al canal ruso, 1 cada 10 segundos...`);

    let successCount = 0;
    let privacyCount = 0;
    let floodCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validUsers.length; i++) {
      const user = validUsers[i];
      const username = user.username ? `@${user.username}` : user.firstName;
      console.log(`[${i + 1}/${validUsers.length}] Intentando añadir a ${username}...`);

      try {
        await client.invoke(new Api.channels.InviteToChannel({
          channel: targetChannel,
          users: [user.id]
        }));
        console.log(`   ✅ Añadido con éxito.`);
        successCount++;
      } catch (err) {
        if (err.message.includes('USER_PRIVACY_RESTRICTED')) {
          console.log(`   🔒 Privacidad: El usuario no permite que lo añadan.`);
          privacyCount++;
        } else if (err.message.includes('FLOOD_WAIT')) {
          console.log(`   🌊 Límite alcanzado (FLOOD WAIT): ${err.message}.`);
          floodCount++;
          // Wait extra if flood happens
          const waitTime = parseInt(err.message.match(/\d+/)[0] || '60', 10);
          console.log(`   ⏳ Esperando ${waitTime} segundos extras por penalización...`);
          await sleep(waitTime * 1000);
        } else if (err.message.includes('USER_ALREADY_PARTICIPANT')) {
          console.log(`   ✅ Ya está en el canal.`);
        } else {
          console.log(`   ❌ Error: ${err.message}`);
          errorCount++;
        }
      }

      // Esperar 10 segundos antes del siguiente
      if (i < validUsers.length - 1) {
        await sleep(delayMs);
      }
    }

    console.log('\n--- RESUMEN FINAL ---');
    console.log(`✅ Añadidos con éxito: ${successCount}`);
    console.log(`🔒 Bloqueados por privacidad: ${privacyCount}`);
    console.log(`🌊 Errores de Flood: ${floodCount}`);
    console.log(`❌ Otros errores: ${errorCount}`);

  } catch (err) {
    console.error('Error general:', err.message);
  }

  process.exit(0);
})();
