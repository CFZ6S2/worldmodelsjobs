const http = require('http');
const axios = require('axios');

const N8N_WEBHOOK_URL = 'http://178.156.186.149:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef';

const COOLDOWN_MS = 5 * 60 * 1000;
const authorCooldowns = new Map();

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/whapi') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const whapiData = JSON.parse(body);
                if (whapiData.messages && whapiData.messages.length > 0) {
                    for (const msg of whapiData.messages) {
                        if (msg.from_me) continue;
                        
                        const author = msg.from;
                        const now = Date.now();
                        
                        if (authorCooldowns.has(author)) {
                            const lastProcessed = authorCooldowns.get(author);
                            if (now - lastProcessed < COOLDOWN_MS) {
                                console.log(`⏳ [COOLDOWN] Ignorando a ${author} (Cooldown activo)`);
                                continue;
                            }
                        }
                        
                        const extractedText = msg.text?.body || msg.caption || '';
                        
                        if (!extractedText) {
                            console.log(`[SKIP] Mensaje sin texto de ${msg.from}`);
                            continue;
                        }

                        // Marcamos el autor con el tiempo actual para el cooldown
                        authorCooldowns.set(author, now);

                        const n8nPayload = {
                            platform: 'whatsApp',
                            from: msg.from,
                            sender: msg.from,
                            chatId: msg.chat_id || msg.from,
                            body: { text: extractedText },
                            text: extractedText,
                            key: { 
                                remoteJid: msg.chat_id || msg.from, // IMPORTANTE: ID del grupo o del usuario
                                fromMe: false 
                            },
                            pushName: msg.from_name || 'Usuario WhatsApp',
                            timestamp: msg.timestamp,
                            source: 'whapi_cloud'
                        };

                        console.log(`🚀 Forwarding to n8n: ${extractedText.substring(0, 50)}...`);
                        await axios.post(N8N_WEBHOOK_URL, n8nPayload);
                    }
                }
                res.writeHead(200);
                res.end('ok');
            } catch (e) {
                res.writeHead(500);
                res.end('error');
            }
        });
    } else {
        res.writeHead(200);
        res.end('Whapi Gateway Original Restored');
    }
});

server.listen(8080, () => {
    console.log('🚀 Pasarela RESTAURADA en puerto 8080');
});
