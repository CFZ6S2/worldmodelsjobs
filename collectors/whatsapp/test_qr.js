const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('test_auth_dir');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true
        });
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) console.log('QR CODE GENERATED!');
            if (connection === 'close') console.log('CLOSED:', lastDisconnect?.error);
            if (connection === 'open') console.log('CONNECTED!');
        });
    } catch (err) {
        console.error('INIT ERROR:', err);
    }
}
start();
