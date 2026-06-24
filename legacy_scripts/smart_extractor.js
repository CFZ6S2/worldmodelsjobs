require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = '/root/worldmodels-jobs/telegram_sniffer/session.txt';
let sessionString = '';
if (fs.existsSync(sessionFile)) {
    sessionString = fs.readFileSync(sessionFile, 'utf8');
}

const targetGroup = '-1002507184558';
const teleleBot = '8499810866'; // Telele bot ID

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log('Connecting to Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    console.log('Fetching all dialogs to rebuild memory cache...');
    await client.getDialogs({ limit: undefined });

    console.log('Fetching last 500 messages from ' + targetGroup + '...');
    try {
        const messages = await client.getMessages(targetGroup, { limit: 500 });
        console.log('Fetched ' + messages.length + ' messages.');

        const models = new Set();
        const keywords = ['рост', 'вес', 'грудь', 'лет', 'года', 'параметры'];

        for (const msg of messages) {
            if (msg.message && msg.senderId) {
                const text = msg.message.toLowerCase();
                const matches = keywords.filter(kw => text.includes(kw));
                if (matches.length >= 1) {
                    const sender = await msg.getSender();
                    if (sender && sender.username && !sender.username.toLowerCase().includes('bot')) {
                        models.add(sender.username);
                    }
                }
            }
        }

        console.log(`Found ${models.size} unique usernames matching keywords. Starting Telele analysis...`);
        
        // Start conversation with Telele if not started
        try {
            await client.sendMessage(teleleBot, { message: '/start' });
            await delay(2000);
        } catch (e) {
            console.log('Error starting Telele:', e.message);
        }

        const realModels = [];

        for (const username of models) {
            console.log(`\nAnalyzing @${username}...`);
            try {
                await client.sendMessage(teleleBot, { message: `https://t.me/${username}` });
                
                // Wait 4 seconds for bot to reply
                await delay(4000);
                
                const replies = await client.getMessages(teleleBot, { limit: 3 });
                let botReply = replies.find(r => r.senderId && r.senderId.toString() === teleleBot && r.message && r.message.includes('Message diversity'));
                
                if (botReply) {
                    const text = botReply.message;
                    
                    // Parse "Message diversity X.XX%"
                    let diversity = 100; // default safe
                    const divMatch = text.match(/diversity ([\d.]+)%/);
                    if (divMatch) diversity = parseFloat(divMatch[1]);
                    
                    // Parse "X messages in Y groups"
                    let groupsCount = 0;
                    const groupMatch = text.match(/in (\d+) groups/);
                    if (groupMatch) groupsCount = parseInt(groupMatch[1]);

                    // Parse "0.00% media"
                    let mediaPerc = 0;
                    const mediaMatch = text.match(/([\d.]+)% media/);
                    if (mediaMatch) mediaPerc = parseFloat(mediaMatch[1]);
                    
                    console.log(`  -> Diversity: ${diversity}%, Groups: ${groupsCount}, Media: ${mediaPerc}%`);
                    
                    // Conditions for rejection
                    if (diversity < 2.0 || groupsCount > 30) {
                        console.log('  [REJECTED] Spam Bot Detected.');
                    } else {
                        console.log('  [ACCEPTED] Looks real.');
                        realModels.push(username);
                    }
                } else {
                    console.log('  [WARNING] No reply from Telele or invalid reply. Assuming real for now.');
                    realModels.push(username);
                }
            } catch (err) {
                console.log(`  [ERROR] Failed to message Telele for @${username}:`, err.message);
            }
            
            // Wait a bit to not spam Telele
            await delay(1500);
        }

        console.log('\n=== FINAL FILTERED REAL MODELS ===');
        for (const username of realModels) {
            console.log('@' + username);
        }
        console.log(`Total: ${realModels.length} out of ${models.size}`);
        console.log('==================================');

    } catch (e) {
        console.error('Error:', e.message);
    }

    await client.disconnect();
    process.exit(0);
})();
