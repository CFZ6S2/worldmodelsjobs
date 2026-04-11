const fetch = require('node-fetch');

const API_URL = 'https://worldmodels-jobs-web-bgr45y36sq-nw.a.run.app/api/leads';

async function testLead() {
    console.log('--- TEST 1: Lead "Escort" (Should be PLAZAS) ---');
    const lead1 = {
        title_es: "VACANTE DISPONIBLE MARBELLA",
        text_es: "Busco chica con buena presencia para trabajar en agencia de Marbella. Se ofrece alojamiento y altos ingresos garantizados. Contacto inmediato para entrevista hoy mismo. Buscamos seriedad y compromiso total.",
        platform: "WhatsApp",
        whatsapp: "34611223344",
        categoria: "CAT_ESCORTS", // Outdated category
        city: "Marbella"
    };

    try {
        const res1 = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead1)
        });
        const data1 = await res1.json();
        console.log('Result 1:', JSON.stringify(data1, null, 2));
    } catch (e) {
        console.error('Error 1:', e.message);
    }

    console.log('\n--- TEST 2: Lead "Habitación" (Should be PLAZAS) ---');
    const lead2 = {
        title_es: "HABITACIÓN DISPONIBLE MADRID",
        text_es: "Alquilo habitación para chicas en el centro de Madrid. Ambiente tranquilo y seguro. Todos los gastos incluidos en el precio. Disponible hoy mismo para entrada inmediata. Contactar por whatsapp ahora.",
        platform: "WhatsApp",
        contact: "Unknown", // Trigger fallback in API
        sender_contact: "34655667788",
        city: "Madrid"
    };

    try {
        const res2 = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead2)
        });
        const data2 = await res2.json();
        console.log('Result 2:', JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error('Error 2:', e.message);
    }
}

testLead();
