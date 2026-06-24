fetch('http://178.156.186.149:5678/webhook/telegram-wm-2024', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: {
      text: "#TEST Busco acompañante para EVENTO en MADRID. Urgente para hoy. Pago bien. Contacto: @TestBotAI",
      chat: { id: -1003757267210 },
      from: { id: 1234, first_name: "Test" }
    }
  })
}).then(r => r.text()).then(console.log).catch(console.error);
