import sqlite3
import json
import sys

db_path = '/root/.n8n/database.sqlite'
id_to_update = 'mpJxAxn2Y5qEAarU'

def update_workflow():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Fetch current data
        cursor.execute('SELECT nodes, name FROM workflow_entity WHERE id = ?', (id_to_update,))
        row = cursor.fetchone()
        if not row:
            print(f'Workflow {id_to_update} not found')
            return
        
        nodes = json.loads(row[0])
        name = row[1]
        print(f"Updating workflow: {name} (ID: {id_to_update})")
        
        # 2. Arreglo Maestro Logic
        master_js = """
// RECUPERAR DATOS DEL WEBHOOK
const item = $input.item.json;

// 1. LIMPIEZA DE CATEGORÍAS (Consistencia Total)
const rawCat = (item.categoria || item.category || 'VARIOS').toUpperCase();
let finalCat = 'CAT_VARIOS';

if (rawCat.includes('PLAZA') || rawCat.includes('FIJA') || rawCat.includes('STAFF')) finalCat = 'CAT_PLAZAS';
else if (rawCat.includes('EVENTO') || rawCat.includes('CASTING')) finalCat = 'CAT_EVENTOS';
else if (rawCat.includes('AGENC')) finalCat = 'CAT_AGENCY';
else if (rawCat.includes('CHICA') || rawCat.includes('MODEL')) finalCat = 'CAT_MODELOS';

// 2. CONSTRUCCIÓN DEL OBJETO DE TRADUCCIONES (Los 4 idiomas)
const translations = {
    "es": { 
        "titulo": item.titulo || "Nueva Oferta", 
        "descripcion": item.descripcion || item.text || "" 
    },
    "en": { 
        "titulo": item.titulo_en || "New Lead", 
        "descripcion": item.descripcion_en || "Check details in the dashboard." 
    },
    "ru": { 
        "titulo": item.titulo_ru || "Новое предложение", 
        "descripcion": item.descripcion_ru || "Проверьте подробности в панели." 
    },
    "pt": { 
        "titulo": item.titulo_pt || "Nova Oferta", 
        "descripcion": item.descripcion_pt || "Confira os detalhes no painel." 
    }
};

// 3. RETORNO DEL JSON "PLATINUM"
return {
    categoria: finalCat,
    plataforma: item.platform || "TELEGRAM",
    ubicacion: item.ubicacion || "Global",
    contacto: item.contacto || item.from_user || "",
    activa: true,
    timestamp: new Date().toISOString(),
    translations: translations,
    external_id: item.message_id || Math.random().toString(36).substring(7)
};
"""

        # 3. Update nodes (targeting generic names found via list_nodes.py)
        found_code = False
        found_http = False
        for node in nodes:
            if node['type'] == 'n8n-nodes-base.code' or node['name'] == 'Code':
                node['parameters']['jsCode'] = master_js
                found_code = True
                print(f"Updated Code node: {node['name']}")
            if node['type'] == 'n8n-nodes-base.httpRequest' or node['name'] == 'HTTP Request':
                node['parameters']['url'] = 'https://europe-west1-worldmodels-jobs.cloudfunctions.net/api/ads'
                node['parameters']['method'] = 'POST'
                found_http = True
                print(f"Updated HTTP Request node: {node['name']}")
                
        if not found_code:
            print('CRITICAL: Code node not found.')
        if not found_http:
            print('CRITICAL: HTTP Request node not found.')

        # 4. Save and ACTIVATE
        cursor.execute('UPDATE workflow_entity SET nodes = ?, active = 1 WHERE id = ?', (json.dumps(nodes), id_to_update))
        conn.commit()
        conn.close()
        print('Workflow database updated and ACTIVATED successfully.')

    except Exception as e:
        print(f"Error during update: {e}")

if __name__ == '__main__':
    update_workflow()
