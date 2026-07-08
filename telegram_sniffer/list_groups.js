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

(async () => {
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 3, autoReconnect: false,
  });
  await client.connect();
  const me = await client.getMe();
  console.log("Logged as: " + (me.phone || me.username || me.id.toString()));

  const dialogs = await client.getDialogs({ limit: 300 });
  const groups = [];
  for (const d of dialogs) {
    if (d.isGroup || d.isChannel) {
      const raw = d.id.toString().replace(/[^0-9]/g, "");
      const id = "-" + raw;
      const name = d.title || d.name || "Sin nombre";
      const members = (d.entity && d.entity.participantsCount) ? d.entity.participantsCount : 0;
      groups.push({ id, name, members });
    }
  }
  groups.sort((a, b) => b.members - a.members);
  console.log("Total grupos/canales: " + groups.length);
  console.log("\n=== YA CONECTADOS ===");
  for (const g of groups) {
    if (CONNECTED.has(g.id)) {
      console.log(g.id + "  [" + String(g.members).padStart(6) + " mbr]  " + g.name);
    }
  }
  console.log("\n=== SIN CONECTAR ===");
  for (const g of groups) {
    if (!CONNECTED.has(g.id)) {
      console.log(g.id + "  [" + String(g.members).padStart(6) + " mbr]  " + g.name);
    }
  }
  await client.disconnect();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
