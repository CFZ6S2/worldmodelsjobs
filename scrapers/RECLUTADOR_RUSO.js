const axios = require('axios');
const fs = require('fs');

const API_KEY = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'; 
const LINK = 'https://chat.whatsapp.com/Lhw1UixH2f68FNBR6VbrUV';
const CONTACTS_FILE = 'TOTAL_CONTACTOS_RUSOS.txt';
const PROGRESS_FILE = 'PROGRESO_RECLUTAMIENTO.json';

const SALUDOS = [
    "🇷🇺 Привет! Вступайте в нашу новую группу WorldModels RU:",
    "Привет! Новые вакансии и предложения здесь:",
    "🇷🇺 Добро пожаловать в наше сообщество:",
    "Привет! Группа WorldModels Jobs RU:"
];

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
    return [];
}

function saveProgress(sentList) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(sentList, null, 2));
}

async function reclutar() {
    if (!fs.existsSync(CONTACTS_FILE)) {
        console.error('❌ No encuentro el archivo de contactos.');
        return;
    }

    const contactos = fs.readFileSync(CONTACTS_FILE, 'utf-8').split('\n').filter(n => n.trim().length > 0);
    let enviados = loadProgress();
    
    console.log(`🚀 Iniciando RECLUTAMIENTO INTELIGENTE.`);
    console.log(`📊 Total: ${contactos.length} | Ya enviados anteriormente: ${enviados.length}`);

    let countThisSession = 0;

    for (let i = 0; i < contactos.length; i++) {
        const num = contactos[i].trim();
        
        // ⏭️ SALTAR SI YA SE ENVIÓ
        if (enviados.includes(num)) {
            continue;
        }

        const saludo = SALUDOS[Math.floor(Math.random() * SALUDOS.length)];
        const mensaje = `${saludo}\n\n${LINK}`;

        console.log(`[${i + 1}/${contactos.length}] Reclutando a +${num}...`);
        
        try {
            await axios.post('https://gate.whapi.cloud/messages/text', {
                to: `${num}@s.whatsapp.net`,
                body: mensaje
            }, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            console.log(`✅ Ok.`);
            enviados.push(num);
            saveProgress(enviados);
            countThisSession++;
        } catch (error) {
            console.error(`❌ Error con +${num}:`, error.response?.data || error.message);
        }

        // 🟢 CADA 5 ENVIADOS EN ESTA SESIÓN -> DESCANSO 5 MIN
        if (countThisSession > 0 && countThisSession % 5 === 0) {
            console.log(`⏸️  Batch de 5 alcanzado. Descansando 5 MINUTOS (300s)...`);
            await delay(5 * 60 * 1000); 
            continue;
        }

        // 🟠 ESPERA CORTA (20-25s)
        const waitTime = Math.floor(Math.random() * (25000 - 20000 + 1) + 20000);
        console.log(`⏳ Espera de seguridad: ${waitTime/1000}s...`);
        await delay(waitTime);
    }

    console.log('🏁 CAMPAÑA FINALIZADA.');
}

reclutar();
