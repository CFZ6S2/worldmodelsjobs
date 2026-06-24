const payload = {
  "message": {
    "text": "📍 Москва \nВстреча с постоянным VIP клиентом\n⏳ 2-3 часа\n💰2500€ чистыми\nКто свободен сегодня вечером?\nПрисылайте фото и видео в личку.",
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
.then(text => console.log('✅ Lead MUY REAL de Ruso enviado a N8N con éxito!', text))
.catch(err => console.error('❌ Error al enviar:', err));
