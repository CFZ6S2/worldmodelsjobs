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

const targetGroup = '-1002507184558'; // Cheri Lady group
const teleleBot = '8499810866';
const queueFile = '/root/worldmodels-jobs/telegram_sniffer/models_queue.json';

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log('Connecting to Telegram...');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    console.log('Fetching all dialogs to ensure Telele entity is cached...');
    await client.getDialogs({ limit: undefined });

    console.log('Fetching participants from ' + targetGroup + '...');
    
    let participants = [];
    try {
        // Fetch up to 1000 participants for this run
        participants = await client.getParticipants(targetGroup, { limit: 1000 });
        console.log('Fetched ' + participants.length + ' participants.');
    } catch (e) {
        console.error('Error fetching participants:', e.message);
        await client.disconnect();
        process.exit(1);
    }

    const now = Math.floor(Date.now() / 1000);
    const activeMembers = [];

    // Filter by online status
    for (const p of participants) {
        if (!p.username || p.bot) continue; // Only process non-bots with usernames
        
        let isActive = false;
        if (p.status) {
            if (p.status.className === 'UserStatusOnline' || p.status.className === 'UserStatusRecently') {
                isActive = true;
            } else if (p.status.className === 'UserStatusOffline') {
                const diff = now - p.status.wasOnline;
                if (diff <= 86400) {
                    isActive = true; // Less than 24 hours
                }
            }
        }
        
        if (isActive) {
            activeMembers.push(p.username);
        }
    }

    console.log(`Found ${activeMembers.length} active users (online, recently, or <24h).`);
    
    // Analyze up to 200 active members per round
    const toAnalyze = activeMembers.slice(0, 200);
    console.log(`Analyzing ${toAnalyze.length} users with Telele (slow & steady, 15s spacing)...`);

    const safeModels = [];

    for (const username of toAnalyze) {
        console.log(`\nAnalyzing @${username}...`);
        try {
            await client.sendMessage(teleleBot, { message: `https://t.me/${username}` });
            await delay(8000); // Wait 8s for Telele to reply
            
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

                // If user is in many groups and has low diversity -> SPAM BOT
                if (groupsCount > 10 && diversity < 5.0) {
                    console.log(`  [REJECTED] Spammer Detected (${diversity}% diversity in ${groupsCount} groups)`);
                } else {
                    console.log(`  [ACCEPTED] Real User (Diversity: ${diversity}%, Groups: ${groupsCount})`);
                    safeModels.push(username);
                }
            } else {
                console.log('  [WARNING] No reply from Telele or no data. Assuming real silent user.');
                safeModels.push(username);
            }
        } catch (err) {
            console.log(`  [ERROR] Telele check failed:`, err.message);
        }

        // Save queue to disk after every user so progress is never lost
        const existingNow = fs.existsSync(queueFile) ? JSON.parse(fs.readFileSync(queueFile, 'utf8')) : [];
        const updatedNow = [...new Set([...existingNow, ...safeModels])];
        fs.writeFileSync(queueFile, JSON.stringify(updatedNow, null, 2));
        
        // 15 seconds between each user - slow & steady, no flood
        await delay(15000);
    }

    console.log('\n=== SAFE MODELS EXTRACTED ===');
    console.log(safeModels.join(', '));
    console.log(`Total safe: ${safeModels.length}`);
    console.log('=============================');

    // Load existing queue
    let existingQueue = [];
    if (fs.existsSync(queueFile)) {
        try {
            existingQueue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
        } catch(e) {}
    }

    // Add new unique safe models
    const updatedQueue = [...new Set([...existingQueue, ...safeModels])];
    fs.writeFileSync(queueFile, JSON.stringify(updatedQueue, null, 2));
    
    console.log(`Added to queue. Total users in queue ready to invite: ${updatedQueue.length}`);

    await client.disconnect();
    process.exit(0);
})();
