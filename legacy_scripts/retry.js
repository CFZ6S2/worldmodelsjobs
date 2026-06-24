const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const http = require('http')
const https = require('https')

const QUEUE_DIR = process.env.QUEUE_DIR || '/root/whatsapp_bot/queue'
const DEFAULT_BASE = process.env.WEBHOOK_URL || 'http://178.156.186.149:5678/'
const MODE = process.env.N8N_MODE || 'prod'
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''
const BASE_BACKOFF_MS = Number(process.env.BASE_BACKOFF_MS || 60000)

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (_) {}
}

function postToN8n(payload) {
  const endpointPath = MODE === 'test' ? 'webhook-test/euromodel/inbound' : 'webhook/euromodel/inbound'
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
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true, statusCode: res.statusCode })
        else reject(new Error('n8n_status_' + res.statusCode))
      })
    })
    req.on('error', err => reject(err))
    req.write(data)
    req.end()
  })
}

function parseStatus(err) {
  const msg = err && err.message ? String(err.message) : ''
  const match = msg.match(/n8n_status_(\d+)/)
  if (match) return Number(match[1])
  return null
}

function shouldRetry(err) {
  const status = parseStatus(err)
  if (status !== null) {
    if (status === 404) return true
    if (status === 502 || status === 503 || status === 504) return true
    if (status === 400 || status === 401 || status === 403) return false
    return true
  }
  const code = err && err.code ? String(err.code) : ''
  if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ETIMEDOUT') return true
  return true
}

async function processQueue() {
  ensureDir(QUEUE_DIR)
  const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json')).sort()
  let sent = 0
  let failed = 0
  let skipped = 0
  for (const f of files) {
    const full = path.join(QUEUE_DIR, f)
    let payload
    let entry
    try {
      const raw = fs.readFileSync(full, 'utf8')
      entry = JSON.parse(raw)
      if (entry && entry.payload) payload = entry.payload
      else payload = entry
    } catch (_) {
      failed++
      continue
    }
    try {
      const createdAt = entry && entry.created_at ? new Date(entry.created_at).getTime() : 0
      const attempt = entry && entry.attempt ? Number(entry.attempt) : 1
      const backoff = Math.max(BASE_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1)))
      const now = Date.now()
      if (createdAt && now - createdAt < backoff) {
        skipped++
        continue
      }
    } catch (_) {}
    try {
      await postToN8n(payload)
      fs.unlinkSync(full)
      sent++
    } catch (e) {
      const retry = shouldRetry(e)
      if (retry) {
        try {
          if (entry && entry.payload) {
            entry.attempt = (entry.attempt || 1) + 1
            entry.last_error_at = new Date().toISOString()
            entry.last_error = e && e.message ? String(e.message) : 'unknown'
            entry.created_at = new Date().toISOString()
            fs.writeFileSync(full, JSON.stringify(entry))
          }
        } catch (_) {}
      } else {
        const renamed = full.replace(/\.json$/i, '.error.json')
        try {
          fs.renameSync(full, renamed)
        } catch (_) {}
      }
      failed++
    }
  }
  return { sent, failed, skipped, total: files.length }
}

if (require.main === module) {
  processQueue()
    .then(r => {
      process.exit(r.failed > 0 ? 1 : 0)
    })
    .catch(() => {
      process.exit(1)
    })
}

module.exports = { processQueue }
