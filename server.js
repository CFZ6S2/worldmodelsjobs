require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Initialize Firebase Admin (WorldModels Database for Leads)
const firebasePath = process.env.WM_FIREBASE_ADMIN_JSON_PATH || path.join(__dirname, 'firebase-admin.json');
const serviceAccount = require(firebasePath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://worldmodels-jobs.firebaseio.com"
});
const db = admin.firestore();
const rtdb = admin.database();
const auth = admin.auth();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const ROUTING_CLIENTS_PATH = path.join(__dirname, 'routing_clients.json');

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
    console.error('🔥 [FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 [FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- RATE LIMITING ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to 500 to accommodate high-frequency automated ingestion
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- JSON ERROR HANDLER ---
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ [JSON ERROR] Malformed body received:', err.body);
        return res.status(400).json({ error: 'Invalid JSON body', received: err.body });
    }
    next();
});

// Apply rate limiting to all API endpoints
app.use('/api/', apiLimiter);
app.use('/jobs-api/', apiLimiter);

// Real-time bridge from n8n (RTDB) to Web (Firestore)
rtdb.ref('/posts').on('child_added', async (snapshot) => {
    try {
        const rawData = snapshot.val();
        if (!rawData) return;

        let body;
        try {
            body = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;
        } catch (e) {
            body = rawData;
        }

        if (!body || body.valido === false) return;

        const text = body.descripcion_limpia || body.description || "-";
        const hash = crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');

        // Check if already in Firestore
        const exists = await db.collection('lead_hashes').doc(hash).get();
        if (exists.exists) return;

        const finalTitulo = body.titulo_web || body.title || "Nuevo Lead Sync";
        const finalCategoria = (body.categoria === 'Acompañante de Viaje' || body.categoria === 'Imagen') ? 'CAT_ESCORTS' : 'CAT_EVENTOS';

        const contact = body.contacto || body.tel || "-";
        const senderDigits = contact.replace(/\D/g, '');
        const isBannedPrefix = BANNED_PREFIXES.some(prefix => senderDigits.startsWith(prefix));

        if (senderDigits && (BANNED_NUMBERS.includes(senderDigits) || isBannedPrefix)) {
            console.log(`🚫 [BRIDGE BANNED] Blocked: ${senderDigits}`);
            return;
        }

        const payload = {
            titulo: finalTitulo,
            descripcion: text,
            ubicacion: body.ubicacion || body.municipio || "Global",
            categoria: finalCategoria,
            contact: contact,
            platform: body.platform || "TELEGRAM",
            timestamp: new Date().toISOString(),
            translations: {
                es: { titulo: finalTitulo, descripcion: text },
                en: { titulo: finalTitulo, descripcion: text },
                ru: { titulo: finalTitulo, descripcion: text },
                pt: { titulo: finalTitulo, descripcion: text }
            },
            activa: true,
            source: "n8n_bridge",
            presupuesto: body.pago || "Open"
        };

        await db.collection('ofertas').add(payload);
        await db.collection('lead_hashes').doc(hash).set({ createdAt: new Date().toISOString() });

        console.log(`🚀 [BRIDGE] Synced legacy lead to Web: ${finalTitulo}`);

        // Trigger Push Notifications to subscribers
        sendPushNotificationsForLead(finalTitulo, text, payload.ubicacion).catch(e => {
            console.error('⚠️ [FCM] Error sending push notification:', e.message);
        });

        // Route to WhatsApp clients
        routeLeadToClients(finalTitulo, text, payload.ubicacion, payload.categoria, payload.translations, payload.contact, payload.platform || "Legacy", payload.presupuesto).catch(e => {
            console.error('⚠️ [ROUTING] Error routing lead:', e.message);
        });
    } catch (err) {
        console.error('❌ [BRIDGE] Error syncing:', err.message);
    }
});

// --- FCM PUSH NOTIFICATIONS BROADCAST ---
// Error codes returned by FCM when a token is permanently invalid
const FCM_STALE_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

async function sendPushNotificationsForLead(title, description, location) {
    try {
        const settingsSnap = await db.collection('user_settings')
            .where('pushEnabled', '==', true)
            .get();

        if (settingsSnap.empty) return;

        // Track token → Firestore doc ref so we can delete stale tokens later
        const tokenMap = new Map(); // token → DocumentReference
        const leadTextLower = (title + " " + description + " " + location).toLowerCase();

        settingsSnap.forEach(doc => {
            const data = doc.data();
            if (!data.fcmToken) return;

            // Optional keyword filter: skip if no keyword matches
            const keywords = Array.isArray(data.keywords) ? data.keywords : [];
            if (keywords.length > 0) {
                const matches = keywords.some(kw => kw && leadTextLower.includes(kw.toLowerCase().trim()));
                if (!matches) return;
            }

            // Last-write-wins for duplicate tokens across docs
            tokenMap.set(data.fcmToken, doc.ref);
        });

        if (tokenMap.size === 0) return;

        const uniqueTokens = [...tokenMap.keys()];

        // Firebase Messaging Multicast (Batch up to 500)
        const message = {
            notification: {
                title: `🔥 ${title || 'Nuevo Lead VIP'}`,
                body: description.length > 120 ? description.substring(0, 117) + '...' : description,
            },
            data: {
                click_action: '/es/feed',
                url: '/es/feed',
                location: location || 'Global'
            },
            tokens: uniqueTokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📱 [FCM] Broadcast sent to ${response.successCount}/${uniqueTokens.length} devices.`);

        // --- STALE TOKEN CLEANUP ---
        // FCM returns per-token results in the same order as the tokens array.
        // Any token that comes back with a permanent-failure code should be
        // removed from Firestore so it never blocks future broadcasts.
        const staleTokens = [];
        response.responses.forEach((result, idx) => {
            if (!result.success && FCM_STALE_CODES.has(result.error?.code)) {
                staleTokens.push(uniqueTokens[idx]);
            }
        });

        if (staleTokens.length > 0) {
            console.log(`🧹 [FCM] Removing ${staleTokens.length} stale token(s) from Firestore...`);
            const batch = db.batch();
            for (const staleToken of staleTokens) {
                const docRef = tokenMap.get(staleToken);
                if (docRef) {
                    batch.update(docRef, {
                        fcmToken: admin.firestore.FieldValue.delete(),
                        pushEnabled: false,
                        tokenRemovedAt: new Date().toISOString(),
                    });
                }
            }
            await batch.commit();
            console.log(`✅ [FCM] Stale tokens purged from Firestore.`);
        }
    } catch (error) {
        console.error('❌ [FCM BROADCAST ERROR]:', error.message);
    }
}

async function routeLeadToClients(title, description, city, categoria, translations = null, contact = "-", source = "Unknown", presupuesto = "Open") {
    try {
        if (!fs.existsSync(ROUTING_CLIENTS_PATH)) return;
        let clients = [];
        try { clients = JSON.parse(fs.readFileSync(ROUTING_CLIENTS_PATH)); } catch (e) { return; }
        
        const activeClients = clients.filter(c => c.active !== false && c.wa && Array.isArray(c.cities));
        if (activeClients.length === 0) return;

        const leadCityLower = (city || '').toLowerCase();
        const textToCheck = `${title} ${description}`.toLowerCase();
        
        let matchedCount = 0;

        for (const client of activeClients) {
            const matchesCity = client.cities.some(cCity => {
                const cLower = cCity.toLowerCase();
                return leadCityLower.includes(cLower) || cLower.includes(leadCityLower);
            });
            if (!matchesCity) continue;

            if (client.categoryFilter) {
                const catFilter = client.categoryFilter.toLowerCase();
                if (!textToCheck.includes(catFilter)) continue;
            }

            matchedCount++;
            
            let msgTitle = title;
            let msgDesc = description;
            const lang = client.lang || 'es';
            
            if (translations && translations[lang]) {
                msgTitle = translations[lang].titulo || msgTitle;
                msgDesc = translations[lang].descripcion || msgDesc;
            }

            const cityUpper = (city || 'GLOBAL').toUpperCase();
            const waLink = String(contact).replace(/\D/g, '');
            const safeWaUrl = waLink ? `https://wa.me/${waLink}` : '';

            const finalMessage = `📢 ALERTA ${cityUpper}\n📍 ${city || 'Global'} | 💰 ${presupuesto}\n\n${msgTitle}\n${msgDesc}\n${safeWaUrl}\n\n👤 Remitente: +${waLink || contact}\n✏️ Fuente: ${source}`;

            console.log(`[ROUTING] Queued for ${client.label} (${client.wa})`);
            
            axios.post(`http://127.0.0.1:${port}/api/juana/send`, {
                to: `${client.wa}@s.whatsapp.net`,
                body: finalMessage
            }).catch(e => console.error(`[ROUTING ERR] Failed to send to ${client.wa}:`, e.message));
        }
        
        if (matchedCount > 0) {
            console.log(`[ROUTING] ${matchedCount} client(s) matched for city="${city}"`);
        }
    } catch (e) {
        console.error('❌ [ROUTING ERROR]:', e.message);
    }
}


// Watch extra paths just in case
rtdb.ref('/leads').on('child_added', snapshot => rtdb.ref('/posts').child(snapshot.key).set(snapshot.val()));
rtdb.ref('/ofertas').on('child_added', snapshot => rtdb.ref('/posts').child(snapshot.key).set(snapshot.val()));

// --- SHARED NORMALIZE LOGIC (Anti-Dedupe Hardened) ---
function normalizeForDedupe(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        // 1. Remove ALL Emojis and Symbols
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        // 2. Remove common noise words/chars used for bypass
        .replace(/[.\-_*~`]/g, '')
        // 3. Remove non-alphanumeric (keep only letters and numbers)
        .replace(/[^a-z0-9ñáéíóúàèìòùâêîôû]/g, '')
        // 4. Ultra-compact
        .trim();
}

function getLeadHash(text) {
    const normalized = normalizeForDedupe(text);
    // If text is effectively empty after cleaning (less than 10 chars), use raw but trimmed as fallback
    const finalInput = normalized.length > 10 ? normalized : text.toLowerCase().replace(/\s+/g, '').trim();
    return crypto.createHash('sha256').update(finalInput).digest('hex');
}

// Intelligent Categorization Engine (Migrated from Cloud Functions)
function autoCategorize(text) {
    const content = (text || '').toLowerCase();
    const plazasKeywords = ['plaza', 'vacante', 'contratando', 'puesto', 'oferta de trabajo', 'trabajo', 'job', 'hiring', 'contratacion', 'se busca', 'requisito', 'reponedor', 'mozo', 'limpieza', 'camarer', 'busco chicas', 'busco modelos', 'agency', 'agencia'];
    const eventosKeywords = ['evento', 'party', 'fiesta', 'show', 'bolo', 'presentacion', 'casting', 'event', 'party', 'club', 'vuelo', 'hotel', 'modelo', 'imagen', 'azafata', 'overnight', 'tonight', 'booking', 'cita', 'meeting', 'disponible ahora', 'outcall', 'incall', 'dinner', 'dinner date'];

    if (plazasKeywords.some(kw => content.includes(kw))) return 'CAT_PLAZAS';
    if (eventosKeywords.some(kw => content.includes(kw))) return 'CAT_EVENTOS';

    return 'CAT_EVENTOS';
}

// --- REMOVED DUPLICATE MIDDLEWARE (Moved to top) ---

// ==========================================
// 1. DUPLICATE GUARD (Anti-Spam)
// ==========================================
const recentLeads = new Map(); // Memory lock for rapid duplicates

app.get('/api/check-duplicate', async (req, res) => {
    const { text, contact, remoteJid } = req.query;
    if (!text) return res.json({ duplicate: false });

    const cleanText = normalizeForDedupe(text);
    const hash = getLeadHash(text);
    const now = Date.now();

    // 1. BRAIN-LEVEL LOCK (Memory)
    // If we saw this exact hash in the last 60 seconds, block it instantly
    if (recentLeads.has(hash)) {
        const lastTime = recentLeads.get(hash);
        if (now - lastTime < 60000) {
            console.log(`🛡️ [LOCK] Instant block for race condition: ${hash.substring(0, 10)}...`);
            return res.json({ duplicate: true, reason: 'memory_lock' });
        }
    }

    // Set the lock
    recentLeads.set(hash, now);

    // HARDENED: Periodic cleanup using setInterval (every hour) instead of size-only
    // size-check still exists as a secondary guard
    if (recentLeads.size > 2000) recentLeads.clear();

    try {
        const ofertasRef = db.collection('ofertas');

        // 2. DB-LEVEL CHECK (Last 24h)
        // We check either the description matches exactly OR the lead_hashes collection has it
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

        // First check lead_hashes (preferred method)
        const hashDoc = await db.collection('lead_hashes').doc(hash).get();
        if (hashDoc.exists) {
            const hData = hashDoc.data();
            const hTime = hData.createdAt ? (hData.createdAt.toMillis ? hData.createdAt.toMillis() : new Date(hData.createdAt).getTime()) : 0;
            if (now - hTime < 24 * 3600 * 1000) {
                console.log(`❌ [GUARD] SHA256 Hash Duplicate blocked: ${hash.substring(0, 10)}`);
                return res.json({ duplicate: true, reason: 'db_hash' });
            }
        }

        const textSnapshot = await ofertasRef
            .where('descripcion_original', '==', cleanText)
            .where('timestamp', '>', dayAgo)
            .limit(1)
            .get();

        if (!textSnapshot.empty) {
            console.log(`❌ [GUARD] DB Duplicate blocked for: ${hash.substring(0, 10)}`);
            return res.json({ duplicate: true, reason: 'db_text' });
        }

        console.log(`✅ [GUARD] New lead accepted: ${cleanText.substring(0, 30)}...`);
        res.json({ duplicate: false });
    } catch (error) {
        console.error('Error checking duplicate:', error.message);
        res.json({ duplicate: false });
    }
});

// ==========================================
// 2. DATA INGESTION & LEGACY COMPATIBILITY
// ==========================================

// --- UTILITIES FOR HARDENING ---
function normalizeForComparison(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
        .replace(/[\u1000-\uFFFF]+/g, "")
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const { BANNED_NUMBERS, BANNED_PREFIXES } = require('./shared_bans.js'); 

const BANNED_KEYWORDS = [
    'crypto', 'binance', 'forex', 'casino', 'stake', 'signals', 'trading', 'pump', 'usdt', 'virtual', 'inversión', 'ganar dinero', 'bitget',
    'nudes', 'onlyfans', 'video llamada', 'packs', 'contenido', 'paypig', 'fimdom',
    'hombre busca', 'pasivo', 'pasivos', 'hombre generoso', 'conoceré', 'man looks', 'man seeking', 'man seeks', 'generous man', 'sugar daddy', 'busco hombre',
    'droga', 'drogas', 'drugs', 'cocaína', 'cocaina', 'coke', 'perico', 'nieve', 'tusi', 'tusibi', '2cb', 'marihuana', 'hierba', 'weed', 'maconha', 'porro', 'canuto', 'pastilla', 'éxtasis', 'extasis', 'mdma', 'mda', 'cristal', 'metanfetamina', 'crack', 'base', 'heroína', 'heroina', 'vaper', 'airbnb'
];

const SPANISH_GROUP_ID = process.env.SPANISH_GROUP_ID || '120363425790792660@g.us';
const EVO_API_KEY = process.env.EVOLUTION_API_KEY || 'EvoWorldModels2026';
const EVO_URL = process.env.EVOLUTION_API_URL || 'http://127.0.0.1:8080';
const VIP_TARGET_NUMBER = process.env.VIP_TARGET_NUMBER || '34658034597@s.whatsapp.net';

// 🛡️ ANTI-BAN HUMANIZER
function humanizeMessage(text) {
    if (!text) return text;
    // Inyectar caracteres invisibles (Zero Width Space/Joiner) de forma aleatoria para que cada mensaje sea único
    const invisibleChars = ['\u200B', '\u200C', '\u200D'];
    return text.split(' ').map(word => {
        if (Math.random() > 0.7) {
            const char = invisibleChars[Math.floor(Math.random() * invisibleChars.length)];
            return word + char;
        }
        return word;
    }).join(' ');
}

// Cola serializada — garantiza que nunca salen dos mensajes simultáneos
let juanaQueue = Promise.resolve();
const JUANA_MIN_DELAY = 8000; // 8s base entre envíos

// 🛡️ JUANA FUNNEL: Universal posting (General & VIP)
app.get('/qr', async (req, res) => {
    try {
        const response = await axios.get(`${EVO_URL}/instance/connect/WorldmodelsOutput?b64=true`, {
            headers: { apikey: EVO_API_KEY }
        });
        
        let base64Image = null;
        if (response.data && response.data.base64) {
            base64Image = response.data.base64;
        } else if (response.data && response.data.qrcode && response.data.qrcode.base64) {
            base64Image = response.data.qrcode.base64;
        }

        if (base64Image) {
            res.send(`
                <html>
                <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f2f5;">
                    <div style="text-align:center; background:white; padding:40px; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <h2>Escanea el QR de Evolution API</h2>
                        <img src="${base64Image}" style="width:300px; height:300px; margin-top:20px;" />
                        <p style="color:#666; margin-top:20px;">Este código se actualiza automáticamente cada 10 segundos.</p>
                    </div>
                    <script>setTimeout(() => location.reload(), 10000);</script>
                </body>
                </html>
            `);
        } else if (response.data && response.data.instance && response.data.instance.state === 'open') {
             res.send(`
                <html>
                <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f2f5;">
                    <div style="text-align:center; background:white; padding:40px; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color:green;">¡Dispositivo Conectado Exitosamente! 🎉</h2>
                        <p>Evolution API ya está vinculada a tu WhatsApp.</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.send(`
                <html>
                <body style="display:flex; justify-content:center; align-items:center; height:100vh;">
                    <div style="text-align:center;">
                        <h2>Generando código QR...</h2>
                        <p>Raw response: ${JSON.stringify(response.data)}</p>
                        <p>Por favor espera un momento.</p>
                    </div>
                    <script>setTimeout(() => location.reload(), 3000);</script>
                </body>
                </html>
            `);
        }
    } catch (error) {
        res.status(500).send("Error al obtener el QR: " + error.message + " | Stack: " + error.stack);
    }
});

app.post('/api/juana/send', async (req, res) => {
    console.log(`📡 [JUANA INCOMING] Request received at ${new Date().toISOString()}`);
    const body = req.body || {};
    const targetChat = body.to || body.chat_id || "";
    const messageText = body.body || body.text || "";

    if (!targetChat || !messageText) {
        return res.status(400).json({ error: "Missing to or body" });
    }

    // 🚫 Solo enviar a contactos individuales — no a grupos
    if (targetChat.endsWith('@g.us')) {
        console.log(`⏭️ [JUANA SKIP] Skipping group target: ${targetChat}`);
        return res.json({ status: "skipped_group" });
    }

    juanaQueue = juanaQueue.then(async () => {
        try {
            const delay = JUANA_MIN_DELAY + Math.floor(Math.random() * 6000);
            console.log(`⏳ [ANTIBAN] Esperando ${delay}ms para evitar bloqueo...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            const humanText = humanizeMessage(messageText);
            const isGroup = targetChat.endsWith('@g.us');
            const targetNumber = isGroup ? targetChat : targetChat.replace('@s.whatsapp.net', '');

            const response = await axios.post(`${EVO_URL}/message/sendText/WorldmodelsOutput`, {
                number: targetNumber,
                options: { delay: 1200, presence: "composing" },
                text: humanText
            }, {
                headers: { 'apikey': EVO_API_KEY }
            });

            console.log(`🚀 [JUANA SUCCESS] Sent to ${targetChat}: ${messageText.substring(0, 30)}...`);
            res.json(response.data);
        } catch (err) {
            console.error('❌ [JUANA ERROR]', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            res.status(500).json({ error: "Failed to forward to Whapi (Juana)" });
        }
    });
});

// --- EVOLUTION API WEBHOOK PROXY ---
app.post('/api/evolution-webhook', async (req, res) => {
    try {
        const body = req.body;
        // Only process message upserts
        if (body.event !== 'messages.upsert') {
            return res.json({ status: "ignored" });
        }

        const data = body.data;
        if (!data || data.key.fromMe) {
            return res.json({ status: "ignored_from_me" });
        }

        const remoteJid = data.key.remoteJid;
        const number = remoteJid.split('@')[0];
        
        let text = "";
        if (data.message?.conversation) text = data.message.conversation;
        else if (data.message?.extendedTextMessage?.text) text = data.message.extendedTextMessage.text;
        else if (data.message?.imageMessage?.caption) text = data.message.imageMessage.caption;
        
        if (!text) return res.json({ status: "no_text" });

        // Transform to match what n8n Extract Metadata WA1 expects
        const n8nPayload = {
            text: { body: text },
            author: number,
            from: number,
            chat_id: remoteJid,
            sender: number,
            platform: "WhatsApp"
        };

        // Forward to n8n Webhook
        await axios.post('http://127.0.0.1:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef', n8nPayload);
        
        console.log(`📩 [WEBHOOK PROXY] Forwarded message from ${number} to n8n`);
        res.json({ status: "forwarded" });
    } catch (err) {
        console.error('❌ [WEBHOOK PROXY ERROR]', err.message);
        res.status(500).json({ error: "Failed to forward" });
    }
});

app.post(['/api/leads', '/jobs-api/api/ads', '/api/ads', '/api/save-data'], async (req, res) => {
    try {
        const body = req.body || {};
        const chatId = body.chatId || body.source_chat_id || body.from || "";

        // 🛡️ SECURITY & PRIVACY FILTER
        // 🛡️ SECURITY & PRIVACY FILTER (Allow WhatsApp @g.us AND Telegram -100 IDs)
        const isTelegram = chatId.startsWith('-100') || body.platform === 'telegram';
        if (chatId && !chatId.endsWith('@g.us') && !isTelegram) {
            console.log(`🛡️ [FILTER] Ignored private chat from: ${chatId}`);
            return res.status(200).json({ success: false, reason: 'private_chat_ignored' });
        }

        const rawDescription = body.text_es || body.description || body.text || body.body?.text_es || body.body?.description || body.body?.text || "-";
        const rawTitle = body.title_es || body.title || body.body?.title_es || body.body?.title || (rawDescription.split('\n')[0].substring(0, 50)) || "Lead Sync";
        const city = body.city || body.location || body.body?.city || body.body?.location || "Global";
        
        // Priorizar el contacto de Telegram si viene de ahí
        const contact = body.from || body.sender_contact || body.contact || body.whatsapp || body.phone || body.body?.contact || body.body?.whatsapp || body.body?.phone || "-";
        
        // Si es un link de Telegram, no le quitamos las letras (porque romperíamos el t.me/usuario)
        const senderDigits = contact.includes('t.me/') ? '' : contact.replace(/\D/g, '');

        // 🚫 BANNED NUMBERS & PREFIXES CHECK
        const isBannedPrefix = BANNED_PREFIXES.some(prefix => senderDigits.startsWith(prefix));
        if (senderDigits && (BANNED_NUMBERS.includes(senderDigits) || isBannedPrefix)) {
            console.log(`🚫 [BANNED] Sender blocked (Prefix or Number): ${senderDigits}`);
            return res.status(200).json({ success: false, reason: 'sender_banned' });
        }

        // 🧠 SEMANTIC DEDUPLICATION
        const normalizedTitle = normalizeForComparison(rawTitle);
        const normalizedCity = normalizeForComparison(city);

        // Check recent semantic matches (last 24h)
        const recentMatch = await db.collection('ofertas')
            .where('ubicacion', '==', city)
            .where('titulo', '==', rawTitle)
            .limit(1).get();

        if (!recentMatch.empty) {
            console.log(`🚫 [BLOCK] Semantic duplicate: ${rawTitle} in ${city}`);
            return res.status(200).json({ success: false, reason: 'semantic_duplicate_blocked' });
        }

        // 🚫 BANNED KEYWORDS CHECK
        const textToCheck = `${rawTitle} ${rawDescription}`.toLowerCase();
        const foundBanned = BANNED_KEYWORDS.find(k => textToCheck.includes(k.toLowerCase()));
        if (foundBanned) {
            console.log(`🚫 [BANNED] Keyword found: "${foundBanned}"`);
            return res.status(200).json({ success: false, reason: 'banned_content', keyword: foundBanned });
        }

        // 🚫 FIRESTORE BLACKLIST CHECK
        if (senderDigits && senderDigits.length > 5) {
            const bannedDoc = await db.collection('banned_users').doc(senderDigits).get();
            if (bannedDoc.exists) return res.status(200).json({ success: false, reason: 'sender_blacklisted_firestore' });
        }

        const hash = getLeadHash(rawDescription);
        const payload = {
            titulo: rawTitle,
            descripcion: rawDescription,
            ubicacion: city,
            categoria: body.category ? (body.category === 'plaza' ? 'CAT_PLAZAS' : 'CAT_EVENTOS') : autoCategorize(rawDescription),
            contact: contact,
            timestamp: new Date().toISOString(),
            platform: (body.platform || "n8n_vps").toUpperCase(),
            activa: true,
            moderation_status: 'auto_approved',
            source: "n8n_elite_v2_original_rules",
            presupuesto: body.pago || "Open",
            translations: {
                es: { titulo: body.title_es || rawTitle, descripcion: body.text_es || rawDescription },
                en: { titulo: body.title_en || rawTitle, descripcion: body.text_en || rawDescription },
                ru: { titulo: body.title_ru || rawTitle, descripcion: body.text_ru || rawDescription },
                pt: { titulo: body.title_pt || rawTitle, descripcion: body.text_pt || rawDescription }
            }
        };

        await db.collection('ofertas').doc(hash).set(payload, { merge: true });
        await db.collection('lead_hashes').doc(hash).set({ createdAt: new Date().toISOString() });

        console.log(`💎 [SAVED] Ingested (Unfiltered): ${rawTitle.substring(0, 30)}`);

        // Route to WhatsApp clients
        routeLeadToClients(rawTitle, rawDescription, city, payload.categoria, payload.translations, payload.contact, payload.platform, payload.presupuesto).catch(e => {
            console.error('⚠️ [ROUTING] Error routing lead:', e.message);
        });

        res.status(200).json({ success: true, id: hash });
    } catch (error) {
        console.error('❌ Ingestion failed:', error.message);
        res.status(500).json({ success: false });
    }
});

const { exec } = require('child_process');

// Middleware to verify Admin
async function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Fallback to monitor token for legacy/internal tools
        const token = req.query.token || req.headers['x-monitor-token'] || req.body.token;
        if (process.env.MONITOR_TOKEN && token === process.env.MONITOR_TOKEN) {
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (userData && (userData.userRole === 'admin' || userData.isAdmin === true || decodedToken.email === 'cesar.herrera.rojo@gmail.com')) {
            req.user = decodedToken;
            return next();
        }
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ==========================================
// 3. MONITORING & HEALTH CHECKS
// ==========================================

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const now = new Date();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        
        const [leads24h, totalLeads, lastLead] = await Promise.all([
            db.collection('ofertas').where('timestamp', '>', dayAgo).count().get(),
            db.collection('ofertas').count().get(),
            db.collection('ofertas').orderBy('timestamp', 'desc').limit(1).get()
        ]);

        let lastLeadTime = 'N/A';
        if (!lastLead.empty) {
            lastLeadTime = lastLead.docs[0].data().timestamp;
        }

        res.json({
            status: 'OK',
            uptime: process.uptime(),
            leads24h: leads24h.data().count,
            totalLeads: totalLeads.data().count,
            lastLeadTime,
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/restart', verifyAdmin, async (req, res) => {
    const { service } = req.body;
    if (!['backend', 'sniffer', 'all'].includes(service)) {
        return res.status(400).json({ error: 'Invalid service' });
    }

    const command = service === 'all' ? 'pm2 restart all' : `pm2 restart worldmodels-${service}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: `Restarted ${service}`, output: stdout });
    });
});

app.get('/api/health/full', async (req, res) => {
    try {
        const now = new Date();
        const stats = {
            status: 'OK',
            uptime: process.uptime(),
            timestamp: now.toISOString(),
            firestore: 'connected',
            last_lead_minutes: -1,
            recent_leads_24h: 0
        };

        // 1. Check Firestore Connection & Last Lead Freshness
        const latestLead = await db.collection('ofertas')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!latestLead.empty) {
            const data = latestLead.docs[0].data();
            const lastLeadTime = new Date(data.timestamp);
            const diffMs = now - lastLeadTime;
            stats.last_lead_minutes = Math.floor(diffMs / 60000);

            // Umbral de alerta: 60 minutos sin leads
            if (stats.last_lead_minutes > 60) {
                stats.status = 'DEGRADED';
                stats.reason = 'No leads received in the last hour';
            }
        } else {
            stats.status = 'WARN';
            stats.reason = 'No leads found in database';
        }

        // 2. Count leads in last 24h
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        const recentCount = await db.collection('ofertas')
            .where('timestamp', '>', dayAgo)
            .count()
            .get();
        
        stats.recent_leads_24h = recentCount.data().count;

        res.json(stats);
    } catch (error) {
        console.error('❌ [HEALTH] Critical error:', error.message);
        res.status(500).json({ status: 'CRITICAL', error: error.message });
    }
});

app.get('/', async (req, res) => {
    // SIMPLE AUTH GUARD
    const monitorToken = process.env.MONITOR_TOKEN;
    if (monitorToken && req.query.token !== monitorToken) {
        return res.status(401).send('Unauthorized: Missing or invalid monitor token');
    }

    try {
        // Fetch Health Data for Dashboard
        const latestLead = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(1).get();
        let healthStatus = 'OK';
        let lastLeadTimeStr = 'N/A';
        
        if (!latestLead.empty) {
            const data = latestLead.docs[0].data();
            const lastLeadTime = new Date(data.timestamp);
            const diffMin = Math.floor((new Date() - lastLeadTime) / 60000);
            lastLeadTimeStr = `${diffMin} min ago`;
            if (diffMin > 60) healthStatus = 'DEGRADED';
        }

        const snapshot = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(50).get();
        let leadsHtml = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            let time = 'Recién';
            if (data.timestamp) {
                if (typeof data.timestamp.toDate === 'function') {
                    time = data.timestamp.toDate().toLocaleString();
                } else {
                    time = new Date(data.timestamp).toLocaleString();
                }
            }
            leadsHtml += `
                <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: white;">
                    <b style="color: #d4af37">[${data.platform || 'TG'}] ${data.titulo}</b><br>
                    <small>${data.ubicacion} | ${time}</small><br>
                    <p style="font-style: italic; font-size: 0.9em;">${(data.descripcion_original || data.descripcion || '').substring(0, 200)}...</p>
                </div>`;
        });

        res.send(`
            <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; padding: 20px;">
                <div style="max-width: 900px; margin: 0 auto;">
                    <header style="display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h1 style="margin: 0;">Platinum Ingestion Monitor</h1>
                        <div style="text-align: right;">
                            <span style="background: ${healthStatus === 'OK' ? '#2ecc71' : '#e74c3c'}; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                                STATUS: ${healthStatus}
                            </span><br>
                            <small>Last Lead: ${lastLeadTimeStr}</small>
                        </div>
                    </header>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                        ${leadsHtml}
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Periodic memory cleanup every 60 minutes
setInterval(() => {
    console.log('🧹 [CLEANUP] Clearing recentLeads map...');
    recentLeads.clear();
}, 60 * 60 * 1000);

/*
// --- AUTO-ALERTS SYSTEM (Heartbeat) ---
async function checkSystemHealth() {
    try {
        const latestLead = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(1).get();
        if (latestLead.empty) return;

        const data = latestLead.docs[0].data();
        const lastLeadTime = new Date(data.timestamp);
        const diffMinutes = Math.floor((new Date() - lastLeadTime) / 60000);

        // Si pasan más de 90 minutos sin leads (umbral crítico de alerta)
        if (diffMinutes > 90) {
            console.log(`🚨 [ALERT] System idle for ${diffMinutes} min. Sending notification...`);
            await axios.post('http://localhost:8080/api/juana/send', {
                to: VIP_TARGET_NUMBER,
                body: `🚨 *WORLDMODELS CRITICAL ALERT*\nEl flujo de leads se ha detenido.\nÚltimo lead: hace ${diffMinutes} min.\nEstado: DEGRADED`
            }, {
                headers: { 'Authorization': `Bearer iUmMsFMUN2CFX8dka6Z1Z54UoyELKWJt` }
            });
        }
    } catch (err) {
        console.error('❌ [HEARTBEAT ERROR]', err.message);
    }
}
setInterval(checkSystemHealth, 45 * 60 * 1000); // Check every 45 mins
*/

// --- ADMIN USER MANAGEMENT ENDPOINTS ---

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        res.json({ users });
    } catch (error) {
        console.error('❌ Failed to get users:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/update', verifyAdmin, async (req, res) => {
    try {
        const { uid, userRole, isAdmin, isPremium } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'Missing uid' });
        }
        
        const updateData = {};
        if (userRole !== undefined) updateData.userRole = userRole;
        if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
        if (isPremium !== undefined) {
            updateData.isPremium = isPremium;
            updateData['worldmodels.premium'] = isPremium;
        }

        console.log(`👤 [ADMIN] Updating user ${uid}:`, updateData);
        await db.collection('users').doc(uid).update(updateData);
        
        // Also update in profiles if it exists
        const profileRef = db.collection('profiles').doc(uid);
        const profileDoc = await profileRef.get();
        if (profileDoc.exists) {
            await profileRef.update(updateData);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Failed to update user:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- IDENTITY & AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

    console.log(`👤 [AUTH] Attempting to register: ${email}`);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      userRole: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      worldmodels: { premium: false }
    };

    // Write to both for compatibility
    await db.collection('users').doc(userRecord.uid).set(userData);
    await db.collection('profiles').doc(userRecord.uid).set(userData);

    console.log(`✅ [AUTH] New user registered: ${email} (${userRecord.uid})`);
    res.json({ ok: true, uid: userRecord.uid });
  } catch (err) { 
    console.error(`❌ [AUTH ERROR] ${err.message}`);
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/profile/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(userDoc.data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// BROADCAST PANEL — envío manual a clientas WA
// ==========================================
const BROADCAST_PASSWORD = process.env.BROADCAST_PASSWORD || 'WMBroadcast2026';

app.get('/admin/broadcast', (req, res) => {
    const pwd = req.query.pwd || '';
    if (pwd !== BROADCAST_PASSWORD) {
        return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WM Broadcast</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f0f0}
form{background:#fff;padding:32px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.1);text-align:center}
input{padding:10px;font-size:16px;border:1px solid #ccc;border-radius:4px;margin-bottom:12px;width:200px}
button{background:#25d366;color:#fff;border:none;padding:10px 24px;font-size:16px;cursor:pointer;border-radius:4px}
</style></head><body>
<form method="get"><h2>🔐 WorldModels Broadcast</h2>
<input name="pwd" type="password" placeholder="Contraseña"><br>
<button type="submit">Entrar</button></form></body></html>`);
    }

    let clients = [];
    try { clients = JSON.parse(fs.readFileSync(ROUTING_CLIENTS_PATH)).filter(c => c.active !== false && c.wa); }
    catch(e) { clients = []; }

    const rows = clients.map(c => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee">
            <input type="checkbox" name="targets" value="${c.wa}" checked>
            <span><strong>${c.label}</strong> <small style="color:#888">+${c.wa}</small></span>
        </label>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WM Broadcast</title>
<style>body{font-family:sans-serif;max-width:580px;margin:40px auto;padding:20px}
h2{color:#333}textarea{width:100%;height:130px;padding:10px;font-size:14px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box}
.box{background:#f8f8f8;border:1px solid #e0e0e0;border-radius:6px;padding:14px;margin:14px 0}
button{background:#25d366;color:#fff;border:none;padding:12px 28px;font-size:16px;cursor:pointer;border-radius:4px;margin-top:10px}
button:hover{background:#1da851}.hint{color:#888;font-size:12px;margin-top:6px}
</style></head><body>
<h2>📢 WorldModels — Envío Manual WA</h2>
<form method="post" action="/admin/broadcast">
<input type="hidden" name="pwd" value="${pwd}">
<div class="box">
<strong>Destinatarias:</strong>
<label style="display:flex;align-items:center;gap:8px;padding:8px 0;font-weight:bold">
  <input type="checkbox" id="all" onclick="document.querySelectorAll('[name=targets]').forEach(c=>c.checked=this.checked)" checked> Todas
</label>
${rows}
</div>
<label><strong>Mensaje:</strong></label><br>
<textarea name="message" placeholder="Escribe el mensaje que quieres enviar..."></textarea>
<p class="hint">Se enviarán con 12 segundos de espera entre cada clienta.</p>
<button type="submit">📤 Enviar</button>
</form></body></html>`);
});

app.post('/admin/broadcast', async (req, res) => {
    const { pwd, message, targets } = req.body;
    if (pwd !== BROADCAST_PASSWORD) return res.status(401).send('No autorizado');
    if (!message || !message.trim()) return res.status(400).send('El mensaje está vacío');

    const targetList = Array.isArray(targets) ? targets : (targets ? [targets] : []);
    if (!targetList.length) return res.status(400).send('Selecciona al menos una destinataria');

    const DELAY = 12000;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Enviando...</title>
<style>body{font-family:sans-serif;max-width:580px;margin:40px auto;padding:20px}
li{padding:6px 0}.ok{color:green}.err{color:#c00}.wait{color:#888}
a{color:#25d366}</style></head><body>
<h2>📤 Enviando...</h2><ul>`);

    for (let i = 0; i < targetList.length; i++) {
        const wa = targetList[i];
        try {
            await axios.post(`${EVO_URL}/message/sendText/AdminSession`,
                { number: wa, options: { delay: 1200, presence: "composing" }, textMessage: { text: message } },
                { headers: { apikey: EVO_API_KEY } }
            );
            res.write(`<li class="ok">✅ +${wa} — enviado</li>`);
            console.log(`📢 [BROADCAST] Sent to ${wa}`);
        } catch(err) {
            const msg = err.response?.data?.error?.message || err.message;
            res.write(`<li class="err">❌ +${wa} — ${msg}</li>`);
            console.error(`📢 [BROADCAST ERR] ${wa}: ${msg}`);
        }
        if (i < targetList.length - 1) {
            res.write(`<li class="wait">⏳ Esperando 12s...</li>`);
            await new Promise(r => setTimeout(r, DELAY));
        }
    }

    res.write(`</ul><p><strong>✅ Listo.</strong></p>
<a href="/admin/broadcast?pwd=${pwd}">← Enviar otro mensaje</a>
</body></html>`);
    res.end();
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Platinum Duplicate Guard listening on port ${port}`);
});
