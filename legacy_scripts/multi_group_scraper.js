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

const teleleBot = '8499810866';
const queueFile = '/root/worldmodels-jobs/telegram_sniffer/models_queue.json';
const reportFile = '/root/worldmodels-jobs/telegram_sniffer/group_report.json';

// All groups the sniffer is in (66 total, excluding own output groups)
const TARGET_GROUPS = [
    { id: '-1003051500037', title: '💸 Rich girls💰' },
    { id: '-1002624249131', title: 'NUTS 🌰' },
    { id: '-1001435925699', title: 'Эскорт' },
    { id: '-1002507184558', title: 'Cheri Lady' },
    { id: '-1001308257482', title: 'Eskort Market' },
    { id: '-1002461480278', title: 'INTIMACY💋 ЧАТ 18+♥️' },
    { id: '-1001152757889', title: 'JOB 4 MODELS' },
    { id: '-1001707521800', title: 'Дубай Чат Вопрос-Ответ🇦🇪' },
    { id: '-1001136915739', title: 'ESKORTES' },
    { id: '-1002673015138', title: 'Sweet Tours ✈️' },
    { id: '-1001380548433', title: 'Знакомства Канада' },
    { id: '-1001693339888', title: 'ДУБАЙ | ЧАТ' },
    { id: '-1001402533739', title: 'КОМСОМОЛКА UA' },
    { id: '-1001430414845', title: 'Эскорт Украина' },
    { id: '-1002548626917', title: 'QUEENS 👑' },
    { id: '-1001426258819', title: 'Эскорт встречи Санкт-Петербург' },
    { id: '-1001689881186', title: 'Escort Tour' },
    { id: '-1001720029343', title: 'Связи в Дубае' },
    { id: '-1002594865633', title: 'Money Lover' },
    { id: '-1001404496291', title: 'Escort Travel' },
    { id: '-1001420590503', title: 'Candy Tours' },
    { id: '-1002604091536', title: 'Lady Boss' },
    { id: '-1002609469701', title: 'Candy 🍬' },
    { id: '-1002589062628', title: 'Dream Tours' },
    { id: '-1002635831328', title: 'KISY 💋' },
    { id: '-1002509296953', title: 'MONEYland' },
    { id: '-1002679658713', title: 'Honey Money' },
    { id: '-1002605698950', title: 'Money Zone' },
    { id: '-1002393942615', title: 'PLAYgirl' },
    { id: '-1001340924134', title: 'ЭСКОРТ РФ' },
    { id: '-1001419643470', title: 'Fruit Tours' },
    { id: '-1001418215301', title: 'КОМСОМОЛКА RU 🇷🇺' },
    { id: '-1001319387466', title: 'Love Market 18+' },
    { id: '-1001362513894', title: 'VIPMODELS | Интимсити' },
    { id: '-1001558011630', title: 'Эскорт в Европе |Чат' },
    { id: '-1001983120251', title: 'Sugar daddy israel vip 🇮🇱' },
    { id: '-1003618490197', title: 'BLUD INDI / RU 🇷🇺' },
    { id: '-1001677536927', title: 'Германия Знакомства Чат 🇩🇪' },
    { id: '-1001626665581', title: '𝒞𝒾𝓃𝒹𝑒𝓇𝑒𝓁𝓁𝒶' },
    { id: '-1001251252043', title: 'ИНДИ RU' },
    { id: '-1002920863332', title: '🩷 Pink girls👙' },
    { id: '-1002640108963', title: 'LOVE LOVE' },
    { id: '-1001258110863', title: 'ЭСКОРТ ЧАТ 24' },
    { id: '-1002375305800', title: 'AK ELITE CLUB' },
    { id: '-1001735002125', title: 'ЭСКОРТ МОСКВЫ' },
    { id: '-1001199137685', title: 'MODEL ZONE' },
    { id: '-1001169996567', title: 'Escort Life' },
    { id: '-1001755484718', title: '👑🍓Princess 2🏞' },
    { id: '-1002425527327', title: '⛓️Темы Турция🇹🇷' },
    { id: '-1003705205249', title: '❤️‍🔥QUEEN WORLD' },
    { id: '-1001607846227', title: 'WORK FOR MODELS' },
    { id: '-1002675827992', title: 'GIRLS модельный имидж' },
    { id: '-1001239793033', title: 'PR-Modeling 1️⃣' },
    { id: '-1001855757898', title: 'Modeling work | Работа для моделей' },
    { id: '-1002535209011', title: 'TOURS ☀️' },
    { id: '-1001483451268', title: '#CastDay • КАСТИНГИ МОСКВА И СПБ' },
    { id: '-1002029212459', title: 'Magic✨Модельные тусовки✨' },
    { id: '-1001946021656', title: 'BIG MONEY' },
    { id: '-1001735731011', title: 'Sweet Dreams' },
    { id: '-1001324688469', title: 'Эскорт каталог' },
    { id: '-1001892734608', title: 'Реклама в Escort 17' },
    { id: '-1001178339775', title: 'FAMILY' },
    { id: '-1001854522298', title: 'Дневник Моники 18+' },
    // Skipped: Worldmodels&Jobs RU (your own output group), ТОЛЬКО ТЕМЫ ВЕСЬ МИР, Channel
];

const delay = ms => new Promise(res => setTimeout(res, ms));

function loadQueue() {
    if (fs.existsSync(queueFile)) {
        try { return JSON.parse(fs.readFileSync(queueFile, 'utf8')); } catch(e) {}
    }
    return [];
}

function saveQueue(queue) {
    fs.writeFileSync(queueFile, JSON.stringify([...new Set(queue)], null, 2));
}

function loadReport() {
    if (fs.existsSync(reportFile)) {
        try { return JSON.parse(fs.readFileSync(reportFile, 'utf8')); } catch(e) {}
    }
    return {};
}

function saveReport(report) {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
}

async function analyzeWithTelele(client, username) {
    try {
        await client.sendMessage(teleleBot, { message: `https://t.me/${username}` });
        await delay(8000);
        const replies = await client.getMessages(teleleBot, { limit: 3 });
        const botReply = replies.find(r =>
            r.senderId && r.senderId.toString() === teleleBot &&
            r.message && r.message.includes('Message diversity')
        );
        if (botReply) {
            const text = botReply.message;
            let diversity = 100;
            const divMatch = text.match(/diversity ([\d.]+)%/);
            if (divMatch) diversity = parseFloat(divMatch[1]);
            let groupsCount = 0;
            const groupMatch = text.match(/in (\d+) groups/);
            if (groupMatch) groupsCount = parseInt(groupMatch[1]);
            return { diversity, groupsCount, replied: true };
        }
        return { diversity: 100, groupsCount: 0, replied: false };
    } catch (e) {
        return { diversity: 100, groupsCount: 0, replied: false, error: e.message };
    }
}

(async () => {
    console.log('=== MULTI-GROUP RUSSIAN SCRAPER STARTING ===');
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();
    console.log('Connected!');

    const report = loadReport();
    const now = Math.floor(Date.now() / 1000);

    console.log(`\nWill analyze ${TARGET_GROUPS.length} groups:`);
    TARGET_GROUPS.forEach((g, i) => console.log(`  ${i+1}. ${g.title} (${g.id})`));

    for (const group of TARGET_GROUPS) {
        const groupId = group.id;
        const groupTitle = group.title;

        // Skip if already analyzed in the last 24h
        if (report[groupId] && (now - report[groupId].timestamp) < 86400) {
            console.log(`\n[SKIP] ${groupTitle} - analyzed less than 24h ago.`);
            continue;
        }

        console.log(`\n============================`);
        console.log(`Analyzing group: ${groupTitle}`);
        console.log(`============================`);

        let participants = [];
        try {
            participants = await client.getParticipants(groupId, { limit: 1000 });
            console.log(`Fetched ${participants.length} participants.`);
        } catch (e) {
            console.log(`Could not fetch participants: ${e.message}`);
            report[groupId] = { title: groupTitle, timestamp: now, error: e.message };
            saveReport(report);
            await delay(5000);
            continue;
        }

        const activeMembers = [];
        for (const p of participants) {
            if (!p.username || p.bot) continue;
            let isActive = false;
            if (p.status) {
                if (p.status.className === 'UserStatusOnline' || p.status.className === 'UserStatusRecently') {
                    isActive = true;
                } else if (p.status.className === 'UserStatusOffline') {
                    if ((now - p.status.wasOnline) <= 86400) isActive = true;
                }
            }
            if (isActive) activeMembers.push(p.username);
        }

        console.log(`Active members (<24h): ${activeMembers.length}`);

        // Analyze up to 200 per group
        const toAnalyze = activeMembers.slice(0, 200);
        let accepted = 0, rejected = 0, noReply = 0;
        const groupAccepted = [];

        for (const username of toAnalyze) {
            console.log(`  Checking @${username}...`);
            const result = await analyzeWithTelele(client, username);

            const queue = loadQueue();
            if (!result.replied) {
                noReply++;
                if (!queue.includes(username)) {
                    queue.push(username);
                    saveQueue(queue);
                }
                groupAccepted.push(username);
            } else if (result.groupsCount > 10 && result.diversity < 5.0) {
                rejected++;
                console.log(`    [REJECTED] ${result.diversity}% div, ${result.groupsCount} groups`);
            } else {
                accepted++;
                console.log(`    [ACCEPTED] ${result.diversity}% div, ${result.groupsCount} groups`);
                if (!queue.includes(username)) {
                    queue.push(username);
                    saveQueue(queue);
                }
                groupAccepted.push(username);
            }

            await delay(15000);
        }

        // Save group report
        report[groupId] = {
            title: groupTitle,
            timestamp: now,
            totalMembers: participants.length,
            activeMembers: activeMembers.length,
            analyzed: toAnalyze.length,
            accepted,
            rejected,
            noReply,
            users: groupAccepted
        };
        saveReport(report);

        console.log(`\nGroup ${groupTitle} done: ${accepted} accepted, ${rejected} rejected, ${noReply} no data.`);
        console.log(`Waiting 30s before next group...`);
        await delay(30000);
    }

    // Final summary
    console.log('\n\n========= FINAL REPORT =========');
    const finalReport = loadReport();
    let totalAccepted = 0;
    for (const [id, data] of Object.entries(finalReport)) {
        if (data.error) {
            console.log(`❌ ${data.title}: ERROR - ${data.error}`);
        } else {
            console.log(`✅ ${data.title}: ${data.accepted || 0} reales / ${data.rejected || 0} bots / ${data.activeMembers || 0} activas`);
            totalAccepted += (data.accepted || 0) + (data.noReply || 0);
        }
    }
    console.log(`\nTOTAL EN COLA LISTA PARA INVITAR: ${loadQueue().length}`);
    console.log('================================');

    await client.disconnect();
    process.exit(0);
})();
