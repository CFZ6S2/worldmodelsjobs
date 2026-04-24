const axios = require('axios');
const fs = require('fs');

const API_KEY = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';

async function superExtraccionRusa() {
    console.log('🚀 Iniciando MEGA-EXTRACCIÓN de rusos en TODOS los grupos...');
    const todosLosRusos = new Set();
    
    try {
        // 1. Obtenemos la lista de todos los grupos
        const resGrupos = await axios.get('https://gate.whapi.cloud/groups?count=100', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const grupos = resGrupos.data.groups || [];
        console.log(`📊 Grupos a escanear: ${grupos.length}`);

        // 2. Escaneamos cada grupo
        for (const grupo of grupos) {
            console.log(`🔍 Escaneando: ${grupo.name}...`);
            try {
                const resMiembros = await axios.get(`https://gate.whapi.cloud/groups/${grupo.id}`, {
                    headers: { 'Authorization': `Bearer ${API_KEY}` }
                });
                const participantes = resMiembros.data.participants || [];
                
                participantes.forEach(p => {
                    const num = p.id.split('@')[0];
                    if (num.startsWith('7')) {
                        todosLosRusos.add(num);
                    }
                });
            } catch (err) {
                console.error(`⚠️ Error al leer grupo ${grupo.name}: Saltando...`);
            }
        }

        // 3. Guardamos resultados
        const listaFinal = Array.from(todosLosRusos);
        console.log('-------------------------------------------');
        console.log(`✅ EXTRACCIÓN COMPLETADA`);
        console.log(`🇷🇺 Rusos únicos encontrados: ${listaFinal.length}`);
        
        if (listaFinal.length > 0) {
            fs.writeFileSync('TOTAL_CONTACTOS_RUSOS.txt', listaFinal.join('\n'));
            console.log('💾 Guardado en: TOTAL_CONTACTOS_RUSOS.txt');
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

superExtraccionRusa();
