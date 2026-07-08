require("dotenv").config({ path: "/root/worldmodels-jobs/.env" });
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = String(process.env.TELEGRAM_API_HASH);
const sessionFile = "/root/worldmodels-jobs/telegram_sniffer/session.txt";
const sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8").trim() : "";

const CONNECTED = new Set([
  "-1002604091536", "-1001169996567", "-1003705205249",
  "-1002904509105", "-1002675827992", "-1001239793033", "-1002029212459"
]);

// Palabras clave de trabajo/leads reales
const JOB_KEYWORDS = [
  "ищу", "ищем", "предлагаю", "работа", "оплата", "гонорар", "кастинг",
  "девушк", "модел", "escort", "tour", "место", "вакансия", "набор",
  "plaza", "busco", "ofrezco", "trabajo", "casting", "looking for",
  "hiring", "seeking", "job", "model", "available", "booking",
  "свободн", "предложени", "агентство", "клиент", "вылет", "выезд"
];

// Palabras de spam/publicidad
const SPAM_KEYWORDS = [
  "подписывайся", "подписаться", "реклама", "канал", "ссылка", "💯", "🔥🔥🔥",
  "переходи", "жми", "кликай", "бесплатно", "скидка", "промокод",
  "t.me/+", "https://t.me/", "join", "subscribe", "channel", "bot",
  "casino", "казино", "ставки", "betting", "crypto", "криптовалют"
];

function scoreMessage(text) {
  if (!text) return { job: 0, spam: 0 };
  const t = text.toLowerCase();
  const job = JOB_KEYWORDS.filter(k => t.includes(k.toLowerCase())).length;
  const spam = SPAM_KEYWORDS.filter(k => t.includes(k.toLowerCase())).length;
  return { job, spam };
}

function hasLink(text) {
  return /https?:\/\/|t\.me\/\+|@\w{5,}/i.test(text || "");
}

(async () => {
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 3, autoReconnect: false,
  });
  await client.connect();

  const dialogs = await client.getDialogs({ limit: 300 });
  const groups = [];
  for (const d of dialogs) {
    if (d.isGroup || d.isChannel) {
      const raw = d.id.toString().replace(/[^0-9]/g, "");
      const id = "-" + raw;
      const name = d.title || d.name || "Sin nombre";
      const members = (d.entity && d.entity.participantsCount) ? d.entity.participantsCount : 0;
      groups.push({ id, name, members, entity: d.entity });
    }
  }
  groups.sort((a, b) => b.members - a.members);

  console.log("ID,CONECTADO,MIEMBROS,JOB_SCORE,SPAM_SCORE,SPAM_PCT,BOT_MSGS,LINKS,MSGS_ANALIZADOS,NOMBRE");

  for (const g of groups) {
    const connected = CONNECTED.has(g.id) ? "SI" : "NO";
    let jobScore = 0, spamScore = 0, botMsgs = 0, linkMsgs = 0, total = 0;

    try {
      const msgs = await client.getMessages(g.entity, { limit: 30 });
      total = msgs.length;
      for (const m of msgs) {
        if (!m.text) continue;
        const s = scoreMessage(m.text);
        jobScore += s.job;
        spamScore += s.spam;
        if (m.viaBotId || (m.fromId && m.fromId.userId && String(m.fromId.userId).endsWith("bot"))) botMsgs++;
        if (hasLink(m.text)) linkMsgs++;
      }
    } catch (e) {
      // grupo no accesible
    }

    const spamPct = total > 0 ? Math.round((spamScore / (jobScore + spamScore + 0.1)) * 100) : 0;
    const name = g.name.replace(/,/g, ";");
    console.log([g.id, connected, g.members, jobScore, spamScore, spamPct + "%", botMsgs, linkMsgs, total, name].join(","));

    await new Promise(r => setTimeout(r, 400)); // rate limit
  }

  await client.disconnect();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
