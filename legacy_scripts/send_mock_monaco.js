const payload = {
  "message": {
    "text": "📍 Mónaco (TEST FALSO)\n¿Quién está disponible para mañana?\n⏳ 2-3h\n💰2000€\nCliente VIP de prueba.",
    "chat": {
      "id": "-100123456789"
    },
    "from": {
      "id": "99999999",
      "username": "tester_bot"
    }
  }
};

fetch('http://localhost:5678/webhook/telegram-wm-2024', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => console.log('✅ Lead falso de Mónaco enviado a N8N con éxito!', text))
.catch(err => console.error('❌ Error al enviar:', err));
