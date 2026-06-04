require('dotenv').config();
const http = require('http');
const axios = require('axios');

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://178.156.186.149:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef';

const COOLDOWN_MS = 10000;
const authorCooldowns = new Map();

const { BANNED_NUMBERS, BANNED_PREFIXES } = require('./shared_bans.js');

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
                        
                        // Ignorar mensajes privados (solo permitir grupos)
                        const chatId = msg.chat_id || msg.from || '';
                        if (!chatId.endsWith('@g.us')) {
                            console.log(`🛡️ [FILTER] Ignorando mensaje privado en whapi_gateway de: ${chatId}`);
                            continue;
                        }

                        const author = msg.from;
                        const now = Date.now();
                        const authorDigits = author ? author.replace(/\D/g, '') : '';
                        
                        // Ban pre IA
                        if (
                            authorDigits && 
                            (BANNED_NUMBERS.includes(authorDigits) || BANNED_PREFIXES.some(prefix => authorDigits.startsWith(prefix)))
                        ) {
                            console.log(`🚫 [BANNED PRE-IA] Ignorando a ${author}`);
                            continue;
                        }

                        if (authorCooldowns.has(author)) {
                            const lastProcessed = authorCooldowns.get(author);
                            if (now - lastProcessed < COOLDOWN_MS) {
                                console.log(`⏳ [COOLDOWN] Ignorando a ${author}`);
                                continue;
                            }
                        }
                        
                        // Extracción de texto mejorada (incluye group invite buttons)
                        let extractedText = msg.text?.body || msg.caption || msg.content || (msg.type === 'text' ? msg.body : '') || '';
                        
                        // Capturar enlaces de grupo desde botón "Únete a este grupo"
                        if (!extractedText && msg.action && msg.action.type === 'group') {
                            const inviteLink = msg.action.invite_link || msg.action.url || '';
                            const groupName = msg.action.group_name || msg.action.title || 'Grupo';
                            extractedText = inviteLink ? `🔗 Grupo: ${groupName}\n${inviteLink}` : '';
                        }
                        // Whapi a veces envía invitaciones como tipo 'group' o con campos de invitación
                        if (!extractedText && msg.type === 'group' && msg.invite_link) {
                            extractedText = `🔗 Grupo: ${msg.group_name || 'Grupo'}\n${msg.invite_link}`;
                        }
                        if (!extractedText && msg.group_invite) {
                            const gi = msg.group_invite;
                            const link = gi.invite_link || gi.url || (gi.invite_code ? `https://chat.whatsapp.com/${gi.invite_code}` : '');
                            extractedText = link ? `🔗 Grupo: ${gi.group_name || gi.subject || 'Grupo'}\n${link}` : '';
                        }
                        
                        // Marcamos el autor
                        authorCooldowns.set(author, now);

                        const n8nPayload = {
                            platform: 'whatsApp',
                            from: msg.from,
                            sender: msg.from,
                            chatId: msg.chat_id || msg.from,
                            body: { text: extractedText },
                            text: extractedText,
                            type: msg.type,
                            key: { 
                                remoteJid: msg.chat_id || msg.from,
                                fromMe: false 
                            },
                            pushName: msg.from_name || 'Usuario WhatsApp',
                            timestamp: msg.timestamp,
                            source: 'whapi_cloud'
                        };

                        console.log(`🚀 Forwarding [${msg.type}] to n8n from ${msg.from_name || msg.from}...`);
                        try {
                            const n8nRes = await axios.post(N8N_WEBHOOK_URL, n8nPayload);
                            console.log(`✅ [N8N] Response: ${n8nRes.status}`);
                        } catch (err) {
                            console.error(`❌ [N8N ERROR] ${err.response?.status || err.code}: ${err.message}`);
                        }
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
