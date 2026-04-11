const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const phoneNumber = "34641382137"

;(async () => {
  const authDir = './auth'
  
  // Clean start if no creds
  if (!fs.existsSync(authDir + '/creds.json')) {
      console.log('Starting fresh session...')
      if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true })
      fs.mkdirSync(authDir)
  }

  const startSock = async () => {
    const { version } = await fetchLatestBaileysVersion()
    console.log('Connecting with WA version: ' + version.join('.'))

    const { state, saveCreds } = await useMultiFileAuthState(authDir)
    const sock = makeWASocket({ 
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Windows', 'Chrome', '11.0.0'], // Very standard
      logger: pino({ level: 'info' }),
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    })

    if (!sock.authState.creds.registered) {
      console.log('Requesting pairing code for ' + phoneNumber + '...')
      await delay(5000)
      try {
          const code = await sock.requestPairingCode(phoneNumber)
          console.log('--- PAIRING CODE: ' + code + ' ---')
      } catch (err) {
          console.error('Error requesting code:', err.message)
          process.exit(1)
      }
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'open') {
        console.log('SUCCESS: BOT CONNECTED!')
      }
      if (connection === 'close') {
          const code = lastDisconnect?.error?.output?.statusCode
          console.log('Connection closed. Reason:', code)
          if (code !== DisconnectReason.loggedOut) {
              console.log('Retrying connection...')
              startSock()
          } else {
              console.log('Logged out. Please delete auth and start again.')
              process.exit(1)
          }
      }
    })
  }

  startSock()
})()
