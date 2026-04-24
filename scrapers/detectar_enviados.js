const axios = require('axios');
const fs = require('fs');

const API_KEY = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const PROGRESS_FILE = 'PROGRESO_RECLUTAMIENTO.json';

async function detectarEnviados() {
    try {
        const response = await axios.get('https://gate.whapi.cloud/messages?from_me=true&count=100', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        const mensajes = response.data.messages || [];
        // Sacamos los números de los mensajes que enviamos nosotros
        const numerosEnviados = mensajes
            .filter(m => m.from_me)
            .map(m => m.chat_id.split('@')[0])
            .filter(n => n.startsWith('7')); // Solo nos importan los rusos

        console.log(`✅ He detectado ${numerosEnviados.length} rusos que ya recibieron mensaje.`);
        
        let progresoActual = [];
        if (fs.existsSync(PROGRESS_FILE)) {
            progresoActual = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        }

        // Fusionamos sin duplicados
        const listaFinal = Array.from(new Set([...progresoActual, ...numerosEnviados]));
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(listaFinal, null, 2));
        
        console.log(`💾 Memoria actualizada. Total bloqueados: ${listaFinal.length}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

detectarEnviados();
