const fs = require('fs');

const file = '/root/worldmodels-jobs/server.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Allow Telegram IDs through the private_chat filter
const oldFilter = `if (chatId && !chatId.endsWith('@g.us')) {`;
const newFilter = `const isTelegram = chatId.startsWith('-100') || body.platform === 'telegram' || body.source === 'telegram_sniffer';
        if (chatId && !chatId.endsWith('@g.us') && !isTelegram) {`;

if (content.includes(oldFilter)) {
    content = content.replace(oldFilter, newFilter);
    console.log('Fix 1 (Telegram filter): PATCHED');
} else if (content.includes('isTelegram')) {
    console.log('Fix 1 (Telegram filter): ALREADY PATCHED');
} else {
    console.log('Fix 1 (Telegram filter): NOT FOUND - manual check needed');
}

// Fix 2: Prioritize 'from' field for contact extraction (for Telegram links)
const oldContact = `const contact = body.contact || body.whatsapp || body.phone || body.body?.contact || body.body?.whatsapp || body.body?.phone || "-";`;
const newContact = `const contact = body.from || body.sender_contact || body.contact || body.whatsapp || body.phone || body.body?.contact || body.body?.whatsapp || body.body?.phone || "-";`;

if (content.includes(oldContact)) {
    content = content.replace(oldContact, newContact);
    console.log('Fix 2 (Contact extraction): PATCHED');
} else if (content.includes('body.from || body.sender_contact')) {
    console.log('Fix 2 (Contact extraction): ALREADY PATCHED');
} else {
    console.log('Fix 2 (Contact extraction): NOT FOUND - checking field...');
    const idx = content.indexOf('const contact =');
    if (idx > -1) console.log('Found at:', content.substring(idx, idx + 120));
}

fs.writeFileSync(file, content);
console.log('Done. File saved.');
