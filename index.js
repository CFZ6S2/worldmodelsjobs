const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { handleUpsert } = require('./bot_wa')
const express = require('express')

;(async () => {
  const { version } = await fetchLatestBaileysVersion()
  console.log('Connecting with WhatsApp v' + version.join('.'))
  
  const authDir = process.env.AUTH_DIR || './auth'
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const sock = makeWASocket({ 
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ['Windows', 'Chrome', '11.0.0'],
    connectTimeoutMs: 60000
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) console.log('--- SCAN QR CODE BELOW ---')
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401
      console.log('Connection closed. Reconnecting:', shouldReconnect)
      if (shouldReconnect) process.exit(1)
    } else if (connection === 'open') {
      console.log('Connection opened successfully!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]) return
    await handleUpsert(messages[0], sock)
  })

  // API for outbound messages
  const app = express()
  app.use(express.json())

  app.post('/api/send', async (req, res) => {
    const { jid, wa_id, text, type, url, mime_type, caption, file_name } = req.body
    let to = jid || (wa_id ? (String(wa_id).includes('@') ? wa_id : String(wa_id) + '@s.whatsapp.net') : null)
    if (!to) return res.status(400).json({ error: 'Missing jid or wa_id' })
    let message
    if (type) {
      const t = String(type).toLowerCase()
      if (!url && !text) return res.status(400).json({ error: 'Missing media url or text' })
      if (t === 'image') {
        message = { image: { url }, caption }
      } else if (t === 'video') {
        message = { video: { url }, caption }
      } else if (t === 'audio') {
        message = { audio: { url }, mimetype: mime_type || undefined }
      } else if (t === 'document') {
        message = { document: { url }, fileName: file_name || undefined, mimetype: mime_type || undefined, caption }
      } else if (t === 'sticker') {
        message = { sticker: { url } }
      } else if (t === 'text') {
        message = { text }
      } else {
        return res.status(400).json({ error: 'Unsupported type' })
      }
    } else if (text) {
      message = { text }
    } else {
      return res.status(400).json({ error: 'Missing text or type' })
    }
    try {
      await sock.sendMessage(to, message)
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  const port = process.env.API_PORT || 3000
  app.listen(port, () => {
    console.log(`Bot API listening on port ${port}`)
  })
})()
