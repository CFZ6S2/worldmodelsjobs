require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const client = new TelegramClient(
    new StringSession(fs.readFileSync('/root/worldmodels-jobs/telegram_sniffer/session.txt', 'utf8')),
    Number(process.env.TELEGRAM_API_ID),
    String(process.env.TELEGRAM_API_HASH),
    { connectionRetries: 5 }
);

(async () => {
    await client.connect();
    
    const normal = await client.getDialogs({ limit: undefined });
    const archived = await client.getDialogs({ limit: undefined, archived: true });
    const all = [...normal, ...archived];
    
    const groups = all
        .filter(x => x.isGroup || x.isChannel)
        .map(x => ({ id: x.id.toString(), title: x.title }));
    
    const unique = [...new Map(groups.map(g => [g.id, g])).values()];
    
    console.log('=== ALL GROUPS & CHANNELS ===');
    unique.forEach((g, i) => console.log(`${i+1}. "${g.title}" => ${g.id}`));
    console.log(`Total: ${unique.length}`);
    
    await client.disconnect();
    process.exit(0);
})();
