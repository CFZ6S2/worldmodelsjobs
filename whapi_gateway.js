require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

// --- CONFIGURATION ---
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const WHAPI_API_URL = process.env.WHAPI_API_URL || 'https://gate.whapi.cloud';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const PORT = process.env.PORT || 8080;
const PUBLIC_GATEWAY_URL = process.env.PUBLIC_GATEWAY_URL;

if (!WHAPI_TOKEN || !N8N_WEBHOOK_URL || !PUBLIC_GATEWAY_URL) {
    throw new Error('Missing required environment variables for WHAPI gateway in .env');
}

// --- HELPERS ---
function httpRequest(method, urlStr, headers, data) {
    const u = new URL(urlStr);
    const options = {
        method: method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        headers: {
            ...headers,
            'Content-Length': data ? Buffer.byteLength(data) : 0
        }
    };
    return new Promise((resolve, reject) => {
        const req = (u.protocol === 'https:' ? https : http).request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// --- GATEWAY SERVER ---
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/whapi') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const whapiData = JSON.parse(body);
                // console.log('Incoming Whapi Data:', JSON.stringify(whapiData, null, 2));

                if (whapiData.messages && whapiData.messages.length > 0) {
                    for (const msg of whapiData.messages) {
                        if (msg.from_me) continue; // Ignore outgoing

                        // 🧠 ROBUST TEXT EXTRACTION (Text, Image Captions, Video Captions, etc.)
                        let extractedText = "";
                        if (msg.type === 'text' && msg.text) {
                            extractedText = msg.text.body;
                        } else if (msg.image && msg.image.caption) {
                            extractedText = msg.image.caption;
                        } else if (msg.video && msg.video.caption) {
                            extractedText = msg.video.caption;
                        } else if (msg.document && msg.document.caption) {
                            extractedText = msg.document.caption;
                        } else if (msg.caption) {
                            extractedText = msg.caption;
                        }

                        if (!extractedText || extractedText.trim().length === 0) {
                            console.log('Skipping non-text message without caption (sticker/empty)');
                            continue;
                        }

                        // Map Whapi to n8n (Baileys-like format)
                        const n8nPayload = {
                            platform: 'whatsApp',
                            body: { text: extractedText },
                            text: extractedText,
                            key: { remoteJid: msg.from },
                            pushName: msg.from_name || 'Usuario WhatsApp',
                            timestamp: msg.timestamp,
                            source: 'whapi_cloud'
                        };

                        console.log('Forwarding to n8n:', extractedText.substring(0, 50));
                        await httpRequest('POST', N8N_WEBHOOK_URL, { 'Content-Type': 'application/json' }, JSON.stringify(n8nPayload));
                    }
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (err) {
                console.error('Error processing Whapi webhook:', err);
                res.writeHead(500);
                res.end('internal_error');
            }
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Whapi Gateway v2 (Robust Extraction) is Running');
    }
});

// --- AUTO-SET WEBHOOK ON STARTUP ---
async function setupWebhook() {
    console.log('Configuring Whapi Webhook (using PATCH)...');
    const url = `${WHAPI_API_URL}/settings`;
    const data = JSON.stringify({
        webhooks: [
            {
                url: PUBLIC_GATEWAY_URL,
                events: [
                    { type: 'messages', method: 'post' }
                ],
                mode: 'body'
            }
        ]
    });

    try {
        const result = await httpRequest('PATCH', url, {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WHAPI_TOKEN}`
        }, data);
        console.log('Whapi Webhook Config Result:', result.body);
    } catch (e) {
        console.error('Failed to set Whapi Webhook:', e.message);
    }
}

server.listen(PORT, () => {
    console.log(`Gateway listening on port ${PORT}`);
    setupWebhook();
});
