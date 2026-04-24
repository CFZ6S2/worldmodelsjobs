const axios = require('axios');
const fs = require('fs');

// CONFIGURACIÓN
const API_KEY = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'; // Token de Juana/Salida
const GRUPO_RU = '120363408298375271@g.us'; // ID de tu grupo de Rusia

async function extraerContactosRusos() {
    console.log(`🇷🇺 Iniciando extracción del grupo: ${GRUPO_RU}...`);
    
    try {
        const response = await axios.get(`https://gate.whapi.cloud/groups/${GRUPO_RU}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const participantes = response.data.participants || [];
        console.log(`📊 Total de miembros detectados: ${participantes.length}`);

        // Filtramos solo los que empiezan por 7 (Rusia)
        const rusos = participantes
            .map(p => p.id.split('@')[0]) // Quitamos el @s.whatsapp.net
            .filter(num => num.startsWith('7'));

        console.log(`✅ Rusos encontrados: ${rusos.length}`);

        if (rusos.length > 0) {
            const contenido = rusos.join('\n');
            fs.writeFileSync('CONTACTOS_RUSOS.txt', contenido);
            console.log('💾 Archivo "CONTACTOS_RUSOS.txt" guardado con éxito.');
        } else {
            console.log('⚠️ No se han encontrado números con prefijo +7 en este grupo.');
        }

    } catch (error) {
        console.error('❌ Error al extraer:', error.response?.data || error.message);
    }
}

extraerContactosRusos();
