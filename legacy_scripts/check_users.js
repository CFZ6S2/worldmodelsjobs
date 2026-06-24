const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = 21743603;
const apiHash = '0b2e3e5512b9195b072120e2e92c2323';
const sessionString = fs.readFileSync('session.txt', 'utf-8').trim();

const targetGroup = '-1001689881186';

(async () => {
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 1 });
  await client.connect();
  console.log('Conectado a Telegram.');

  try {
    const participants = await client.getParticipants(targetGroup, { limit: 5000 });
    console.log(`Total de participantes encontrados: ${participants.length}`);

    let bots = 0;
    let deleted = 0;
    let online = 0;
    let recently = 0;
    let offline = 0;
    let validUsers = [];

    for (const user of participants) {
      if (user.bot) {
        bots++;
      } else if (user.deleted) {
        deleted++;
      } else {
        // Evaluate status
        if (user.status) {
          const s = user.status.className;
          if (s === 'UserStatusOnline') {
            online++;
            validUsers.push(user);
          } else if (s === 'UserStatusRecently') {
            recently++;
            validUsers.push(user);
          } else if (s === 'UserStatusOffline') {
            // we could check when they were last online, but let's just count them
            offline++;
            // if offline but recently within 7 days, they might be good
          } else {
            offline++;
          }
        } else {
          offline++;
        }
      }
    }

    console.log(`- Bots: ${bots}`);
    console.log(`- Eliminados (Scam/Deleted): ${deleted}`);
    console.log(`- Online ahora: ${online}`);
    console.log(`- Conectados recientemente: ${recently}`);
    console.log(`- Offline/Ocultos: ${offline}`);
    console.log(`\nTotal de usuarios 'buenos' (Online o Recientemente): ${validUsers.length}`);

  } catch (err) {
    console.error('Error al obtener participantes:', err.message);
  }

  process.exit(0);
})();
