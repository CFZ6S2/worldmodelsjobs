require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = fs.readFileSync(sessionFile, 'utf8');

const targetGroup = '-1001689881186';

(async () => {
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 1 });
  await client.connect();
  console.log('Conectado a Telegram.');

  try {
    const participants = await client.getParticipants(targetGroup, { limit: 5000 });
    console.log('Total de participantes encontrados:', participants.length);

    let bots = 0;
    let deleted = 0;
    let online = 0;
    let recently = 0;
    let offline = 0;

    for (const user of participants) {
      if (user.bot) {
        bots++;
      } else if (user.deleted) {
        deleted++;
      } else {
        if (user.status) {
          const s = user.status.className;
          if (s === 'UserStatusOnline') {
            online++;
          } else if (s === 'UserStatusRecently') {
            recently++;
          } else {
            offline++;
          }
        } else {
          offline++;
        }
      }
    }

    console.log('- Bots:', bots);
    console.log('- Eliminados (Scam/Deleted):', deleted);
    console.log('- Online ahora:', online);
    console.log('- Conectados recientemente:', recently);
    console.log('- Offline/Ocultos:', offline);
    console.log('Total de usuarios buenos (Online o Recientemente):', online + recently);

  } catch (err) {
    console.error('Error al obtener participantes:', err.message);
  }

  process.exit(0);
})();
