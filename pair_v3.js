const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const phoneNumber = "34641382137"

;(async () => {
  const authDir = './auth'
  
  // Clean start
  if (fs.existsSync(authDir)) {
      console.log('Cleaning old session data...')
      fs.rmSync(authDir, { recursive: true, force: true })
  }
  fs.mkdirSync(authDir)

  const { version } = await fetchLatestBaileysVersion()
  console.log('Using WhatsApp version: ' + version.join('.'))

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const sock = makeWASocket({ 
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Mac OS', 'Safari', '10.15.7'], // More standard browser
    logger: pino({ level: 'silent' })
  })

  console.log('Requesting pairing code for ' + phoneNumber + '...')
  await delay(5000) // Small wait for socket stability
  
  try {
      const code = await sock.requestPairingCode(phoneNumber)
      console.log('--- YOUR NEW PAIRING CODE IS ---')
      console.log(code)
      console.log('----------------------------')
  } catch (err) {
      console.error('Error requesting code:', err.message)
      process.exit(1)
  }

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log('SUCCESS: CONNECTED!')
    }
    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        console.log('Connection closed. Reason:', reason)
        // Auto-reconnect or exit
    }
  })
})()
