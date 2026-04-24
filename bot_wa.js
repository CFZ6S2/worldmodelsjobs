const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const http = require('http')
const https = require('https')
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' })

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception detected')
  // We don't exit to keep the PM2 process alive if possible, 
  // but in a real prod env you might want to exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection at Promise')
})

// --- RATE LIMITING (Memory Based) ---
const rateLimits = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10

function isRateLimited(jid) {
  const now = Date.now()
  if (!rateLimits.has(jid)) {
    rateLimits.set(jid, [now])
    return false
  }
  const timestamps = rateLimits.get(jid).filter(ts => now - ts < RATE_LIMIT_WINDOW)
  if (timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    return true
  }
  timestamps.push(now)
  rateLimits.set(jid, timestamps)
  return false
}

const QUEUE_DIR = process.env.QUEUE_DIR || '/root/whatsapp_bot/queue'
const DEFAULT_BASE = process.env.WEBHOOK_URL || 'http://178.156.186.149:5678/'
const MODE = process.env.N8N_MODE || 'prod'
const WORKFLOW = process.env.WORKFLOW_NAME || 'Euromodel_Master_System'
const MEDIA_DIR = process.env.MEDIA_DIR || '/var/www/whatsapp_media'
const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL || 'http://178.156.186.149/media/'
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''

function isLocalHost(x){return /(^|\/\/|:)127\./.test(String(x))}
// if (isLocalHost(DEFAULT_BASE) || isLocalHost(MEDIA_BASE_URL) || isLocalHost(N8N_WEBHOOK_URL)) { throw new Error('forbidden_localhost') }

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (_) {}
}

let downloadContentFromMessage
try {
  downloadContentFromMessage = require('@whiskeysockets/baileys').downloadContentFromMessage
} catch (_) {
  downloadContentFromMessage = null
}

function postToN8n(payload) {
  const endpointPath = MODE === 'test' ? 'webhook-test/webhook-test/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef' : 'webhook/webhook-test/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef'
  const base = DEFAULT_BASE.endsWith('/') ? DEFAULT_BASE : DEFAULT_BASE + '/'
  const full = N8N_WEBHOOK_URL ? N8N_WEBHOOK_URL : new URL(endpointPath, base).toString()
  const u = new URL(full)
  const data = JSON.stringify(payload)
  const opts = {
    method: 'POST',
    hostname: u.hostname,
    port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80,
    path: u.pathname + u.search,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }
  return new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).request(opts, res => {
      let body = ''
      res.on('data', chunk => {
        body += chunk
      })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(true)
        else reject(new Error('n8n_status_' + res.statusCode))
      })
    })
    req.on('error', err => reject(err))
    req.write(data)
    req.end()
  })
}

function enqueue(payload) {
  ensureDir(QUEUE_DIR)
  const tsRaw = new Date().toISOString()
  const ts = tsRaw.replace(/[:.]/g, '-')
  const rid = payload.request_id || crypto.randomUUID()
  const mid = payload.message && payload.message.message_id ? payload.message.message_id : 'noid'
  const entry = {
    request_id: rid,
    message_id: mid,
    created_at: tsRaw,
    attempt: 1,
    payload
  }
  const fn = path.join(QUEUE_DIR, ts + '_' + rid + '_' + mid + '.json')
  fs.writeFileSync(fn, JSON.stringify(entry))
  return fn
}

function createPayload({ senderJid, msg, messageType, text, mediaUrl, mimeType, workflowName }) {
  const workflow = workflowName || WORKFLOW
  const sender = senderJid || (msg && msg.key ? msg.key.participant || msg.key.remoteJid : '')
  return {
    event: 'message.received',
    source: 'whatsapp',
    workflow,
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sender: {
      wa_id: String(sender).replace(/[^0-9]/g, ''),
      jid: sender,
      push_name: (msg && msg.pushName) ? msg.pushName : 'Usuario',
      is_group: String(sender).endsWith('@g.us')
    },
    message: {
      message_id: msg && msg.key && msg.key.id ? msg.key.id : '',
      type: messageType || 'unknown',
      text: text || null,
      media: {
        url: mediaUrl || null,
        mime_type: mimeType || null
      }
    }
  }
}

function extractSender(msg) {
  const jid = msg.key && (msg.key.participant || msg.key.remoteJid) ? (msg.key.participant || msg.key.remoteJid) : ''
  const wa_id = jid.replace(/[^0-9]/g, '')
  const push_name = msg.pushName ? msg.pushName : 'Usuario'
  const is_group = jid.endsWith('@g.us')
  return { jid, wa_id, push_name, is_group }
}

function extractContent(msg) {
  const m = msg.message || {}
  let type = null
  let text = null
  let mime_type = null
  if (m.conversation) {
    type = 'text'
    text = m.conversation
  } else if (m.extendedTextMessage && m.extendedTextMessage.text) {
    type = 'text'
    text = m.extendedTextMessage.text
  } else if (m.imageMessage) {
    type = 'image'
    text = m.imageMessage.caption || null
    mime_type = m.imageMessage.mimetype || null
  } else if (m.videoMessage) {
    type = 'video'
    text = m.videoMessage.caption || null
    mime_type = m.videoMessage.mimetype || null
  } else if (m.documentMessage) {
    type = 'document'
    text = m.documentMessage.caption || null
    mime_type = m.documentMessage.mimetype || null
  } else if (m.audioMessage) {
    type = 'audio'
    mime_type = m.audioMessage.mimetype || null
  } else if (m.stickerMessage) {
    type = 'sticker'
  } else if (m.contactMessage) {
    type = 'contact'
  } else if (m.locationMessage) {
    type = 'location'
  } else if (m.pollUpdateMessage) {
    type = 'poll'
  } else if (m.buttonsResponseMessage) {
    type = 'button_response'
    text = m.buttonsResponseMessage.selectedDisplayText || null
  } else if (m.listResponseMessage) {
    type = 'list_response'
    text = m.listResponseMessage.title || null
  } else {
    type = 'unknown'
  }
  return { type, text, mime_type }
}

function extFromMime(mime) {
  if (!mime) return ''
  const normalized = String(mime).toLowerCase()
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/3gpp': '.3gp',
    'video/3gp': '.3gp',
    'audio/ogg; codecs=opus': '.ogg',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  }
  if (map[normalized]) return map[normalized]
  const parts = normalized.split('/')
  if (parts.length === 2) {
    let sub = parts[1]
    const semi = sub.indexOf(';')
    if (semi !== -1) sub = sub.slice(0, semi)
    if (sub) {
      if (sub === 'jpeg') sub = 'jpg'
      return '.' + sub
    }
  }
  return ''
}

function mediaNode(msg, type) {
  const m = msg.message || {}
  if (type === 'image') return m.imageMessage
  if (type === 'video') return m.videoMessage
  if (type === 'document') return m.documentMessage
  if (type === 'audio') return m.audioMessage
  if (type === 'sticker') return m.stickerMessage
  return null
}

async function saveMedia(requestId, msg, content) {
  if (!downloadContentFromMessage) return { url: null, mime_type: content.mime_type || null }
  const node = mediaNode(msg, content.type)
  if (!node) return { url: null, mime_type: content.mime_type || null }
  const mime = node.mimetype || content.mime_type || ''
  const stream = await downloadContentFromMessage(node, content.type)
  let buf = Buffer.alloc(0)
  for await (const chunk of stream) {
    buf = Buffer.concat([buf, chunk])
  }
  ensureDir(MEDIA_DIR)
  const ext = extFromMime(mime)
  const mid = msg.key && msg.key.id ? msg.key.id : 'noid'
  const fname = requestId + '_' + mid + (ext || '')
  const fpath = path.join(MEDIA_DIR, fname)
  fs.writeFileSync(fpath, buf)
  const base = MEDIA_BASE_URL.endsWith('/') ? MEDIA_BASE_URL : MEDIA_BASE_URL + '/'
  return { url: base + fname, mime_type: mime || null }
}

async function handleUpsert(msg, sock) {
  const sender = extractSender(msg)
  const content = extractContent(msg)
  const txt = (content.text || '').trim()
  
  // 1. Rate Limiting Check
  if (isRateLimited(sender.jid)) {
    logger.warn({ jid: sender.jid, wa_id: sender.wa_id }, 'Rate limit exceeded for user')
    return { ok: false, filtered: true, reason: 'rate_limit_exceeded' }
  }

  // 2. Strict Policy Filtering
  const hasDigits = /\d/.test(txt)
  const lenOk = txt.length >= 50
  const banned = ['cambio', 'gratis', 'paja']
  const containsBanned = banned.some(w => txt.toLowerCase().includes(w))
  
  if (!txt || !lenOk || !hasDigits || containsBanned) {
    const reason = !txt ? 'no_text' : !lenOk ? 'too_short' : !hasDigits ? 'no_digits' : 'banned_word'
    logger.debug({ jid: sender.jid, reason }, 'Message filtered by policy')
    return { ok: false, filtered: true, reason }
  }

  const payload = {
    event: 'message.received',
    source: 'whatsapp',
    workflow: WORKFLOW,
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sender: {
      wa_id: sender.wa_id,
      jid: sender.jid,
      push_name: sender.push_name,
      is_group: sender.is_group
    },
    message: {
      message_id: msg.key && msg.key.id ? msg.key.id : '',
      type: content.type,
      text: content.text || null,
      media: {
        url: null,
        mime_type: content.mime_type || null
      }
    }
  }

  if (['image', 'video', 'document', 'audio', 'sticker'].includes(content.type)) {
    try {
      const media = await saveMedia(payload.request_id, msg, content)
      payload.message.media.url = media.url
      payload.message.media.mime_type = media.mime_type
    } catch (err) {
      logger.error({ err, request_id: payload.request_id }, 'Failed to save media')
    }
  }

  try {
    await postToN8n(payload)
    logger.info({ jid: sender.jid, request_id: payload.request_id }, 'Message synced to n8n')
    return { ok: true }
  } catch (e) {
    const file = enqueue(payload)
    logger.error({ err: e.message, file, request_id: payload.request_id }, 'Failed to sync to n8n, enqueued')
    return { ok: false, queued: file }
  }
}

module.exports = { handleUpsert, postToN8n, enqueue, createPayload, saveMedia }
