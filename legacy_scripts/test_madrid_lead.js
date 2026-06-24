const axios = require('axios');

async function testMadrid() {
  const payload = {
    message: {
      chat: { id: -100123456 },
      text: "Busco chica urgente para fiesta esta noche en Madrid. Pago 1000 eur.",
      from: { id: 12345, username: "test_client" }
    }
  };

  try {
    const res = await axios.post('http://178.156.186.149:5678/webhook/telegram-wm-2024', payload);
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testMadrid();
