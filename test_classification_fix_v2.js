async function testClassification() {
  const url = 'https://ssrworldmodelsjobs-bgr45y36sq-nw.a.run.app/api/leads';
  
  const examples = [
    {
      name: "Example 1: Gana 4 Mil Semanales Plaza",
      body: {
        rawText: "EVENTOS 14:29 WhatsApp Gana 4 Mil Semanales Plaza holanda 50% reservar tu cupo ahora. 30 min 120 1 hora 200 Salida 1 hora 250 Todo extra para ti Telefonista 24/7 Taxi 24/7 Seguridad 24/7 Ganar minimo 4 mil en semana Necesito Chicas hermosa. Maximo 28 anos",
        sender_digits: "34600111222",
        city: "Holanda",
        summary: "Plaza Holanda 50% - Gana 4 Mil",
        contact: "34600111222"
      }
    },
    {
      name: "Example 2: Plaza 50% Torrevieja",
      body: {
        rawText: "EVENTOS 14:24 WhatsApp Plaza 50% Torrevieja Chicas ✨ PLAZA DISPONIBLE AL 50% ✨ NECESITO 2 CHICAS🚨🚨 📌 Torrevieja-Alicante 🏖️ Apartamento bonito y acogedor en excelente zona, muy cerca de la playa y supermercados, perfecto para trabajar cómoda y tranquila. 👭 Máximo 4 chicas en el piso",
        sender_digits: "34600333444",
        city: "Torrevieja",
        summary: "Plaza Disponible 50% Torrevieja",
        contact: "34600333444"
      }
    }
  ];

  console.log("--- STARTING CLASSIFICATION VERIFICATION (FETCH) ---");
  
  for (const ex of examples) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ex.body)
      });
      const data = await resp.json();
      console.log(`\nTesting: ${ex.name}`);
      console.log(`Result: ${data.message || 'Success'}`);
      console.log(`Full Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error in ${ex.name}:`, err.message);
    }
  }
}

testClassification();
