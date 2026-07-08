

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const webhookUrl = process.env.WEBHOOK_URL || 'http://n8n:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef';

async function start() {
    console.log('--- STARTING WHATSAPP COLLECTOR V6.4 (PM2 PERSISTENT) ---');
    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('baileys_v6_pm2');
        
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '110.0.0.0']
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                console.log('--- QR CODE (ESCANÉALO PARA PM2): ---');
                qrcode.generate(qr, { small: true });
                console.log('--- SCAN THE QR ABOVE TO LINK PM2 ---');
            }
            if (connection === 'close') {
                const errorCode = lastDisconnect.error?.output?.statusCode;
                if (errorCode !== DisconnectReason.loggedOut) {
                    setTimeout(start, 5000);
                }
            } else if (connection === 'open') {
                console.log('--- SUCCESS: WHATSAPP COLLECTOR ACTIVE IN PM2 ---');
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        const jid = msg.key.remoteJid;
                        
                        // 🛡️ SECURITY FILTER: Only process messages from Groups.
                        // Skip any private conversations (@s.whatsapp.net).
                        if (!jid.endsWith('@g.us')) continue;
                        let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                        
                        // Capturar enlaces de grupo desde botón "Únete a este grupo"
                        if (!text && msg.message?.groupInviteMessage) {
                            const gi = msg.message.groupInviteMessage;
                            const inviteCode = gi.inviteCode || '';
                            const groupName = gi.groupName || 'Grupo';
                            const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : '';
                            text = inviteLink ? `🔗 Grupo: ${groupName}\n${inviteLink}` : `🔗 Grupo: ${groupName}`;
                        }
                        
                        if (text) {
                            try {
                                await axios.post(webhookUrl, {
                                    jid: jid,
                                    text: text,
                                    isGroup: jid.endsWith('@g.us'),
                                    pushName: msg.pushName,
                                    from: msg.key.participant || msg.key.remoteJid || ''
                                });
                                console.log('[SENT] JID: ' + jid);
                            } catch (err) {
                                console.error('  => Error:', err.message);
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('FATAL:', err);
    }
}
start();
