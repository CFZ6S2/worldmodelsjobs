const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:5678/webhook/worldmodelsjobs-lead';

async function start() {
    console.log('Starting WhatsApp Collector (Live Sync Fix)...');
    const { state, saveCreds } = await useMultiFileAuthState('sessions/baileys_auth_V6');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log('Using WA v' + version.join('.') + ', isLatest: ' + isLatest);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'warn' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: ['Windows', 'Chrome', '120.0.0.0'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        printQRInTerminal: false,
        getMessage: async (key) => { return { conversation: 'hello' } }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, {small: true});
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if(shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('WhatsApp Collector is ready and deeply connected!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        console.log('>>> Received messages.upsert event with ' + m.messages.length + ' messages. Type: ' + m.type);
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe) {
                    const jid = msg.key.remoteJid || 'unknown';
                    const isGroup = jid.endsWith('@g.us');
                    
                    let text = 'NO_TEXT';
                    if (msg.message) {
                        text = msg.message?.conversation || 
                               msg.message?.extendedTextMessage?.text || 
                               msg.message?.imageMessage?.caption ||
                               msg.message?.videoMessage?.caption;
                    }
                    
                    console.log('[RCV] Group: ' + isGroup + ' | JID: ' + jid + ' | TextLens: ' + (text ? text.length : 0));

                    if (text && text !== 'NO_TEXT') {
                        const senderId = jid.split('@')[0];
                        const augmentedText = '[WA: ' + senderId + '] ' + text;
                        
                        const payload = {
                            text: augmentedText,
                            source: 'whatsapp',
                            from: jid,
                            author: msg.key.participant || jid,
                            timestamp: msg.messageTimestamp
                        };
                        try {
                            await axios.post(webhookUrl, payload);
                            console.log('  => Lead reenviado a n8n: ', augmentedText.substring(0, 50) + '...');
                        } catch (err) {
                            console.error('  => Forward error:', err.message);
                        }
                    }
                }
            }
        }
    });
}

start();