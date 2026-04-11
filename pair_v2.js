const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys')
const pino = require('pino')

const phoneNumber = "34641382137"

;(async () => {
  const authDir = './auth'
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const sock = makeWASocket({ 
    auth: state,
    printQRInTerminal: false,
    browser: ['Euromodel Bot', 'Chrome', '1.0.0'],
    logger: pino({ level: 'silent' })
  })

  if (!sock.authState.creds.registered) {
    console.log('Requesting pairing code for ' + phoneNumber + '...')
    await delay(3000)
    const code = await sock.requestPairingCode(phoneNumber)
    console.log('--- YOUR PAIRING CODE IS ---')
    console.log(code)
    console.log('----------------------------')
  }

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (update) => {
    const { connection } = update
    if (connection === 'open') {
      console.log('SUCCESS: CONNECTED!')
    }
  })
})()
