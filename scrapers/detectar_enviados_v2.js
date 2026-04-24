const axios = require('axios');
const fs = require('fs');

const API_KEY = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const PROGRESS_FILE = 'PROGRESO_RECLUTAMIENTO.json';

async function detectarPorChats() {
    try {
        const response = await axios.get('https://gate.whapi.cloud/chats?count=100', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        const chats = response.data.chats || [];
        const numerosEnviados = chats
            .map(c => c.id.split('@')[0])
            .filter(n => n.startsWith('7'));

        console.log(`✅ He detectado ${numerosEnviados.length} chats con rusos.`);
        
        let progresoActual = [];
        if (fs.existsSync(PROGRESS_FILE)) {
            progresoActual = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        }

        const listaFinal = Array.from(new Set([...progresoActual, ...numerosEnviados]));
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(listaFinal, null, 2));
        
        console.log(`💾 Memoria sincronizada. No se repetirá a ninguno de estos ${listaFinal.length} números.`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

detectarPorChats();
