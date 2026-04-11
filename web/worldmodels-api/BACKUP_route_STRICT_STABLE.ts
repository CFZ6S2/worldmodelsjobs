import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API-V2] Recibido Lead:', JSON.stringify(body, null, 2));

    // Si n8n ya marcó como trash, no procesamos
    if (body.trash === true || body.trash_early === true) {
      return NextResponse.json({ success: true, message: 'Lead descartado (Trash Filter)' });
    }

    // Mapeo robusto: Aceptamos variantes de n8n o directas
    const incomingCat = (body.categoria || body.category || 'CAT_ESCORTS').toUpperCase();
    const cleanCat = incomingCat.startsWith('CAT_') ? incomingCat : `CAT_${incomingCat}`;

    // 🔥 FILTRADO ESTRICTO DE CATEGORÍAS (Only these 3)
    const VALID_CATEGORIES = ['CAT_PLAZAS', 'CAT_EVENTOS', 'CAT_ESCORTS'];
    if (!VALID_CATEGORIES.includes(cleanCat)) {
      console.warn(`[API-V2] Categoría no válida detectada: ${cleanCat}. Descartando.`);
      return NextResponse.json({ success: true, message: 'Lead descartado (Categoría no válida)' });
    }

    const baseLead = {
      category: cleanCat,
      city: body.city || body.ubicacion || body.ciudad || 'Global',
      budget: body.budget || body.presupuesto || 'A convenir',
      contact: body.contact || body.sender_contact || body.whatsapp || '',
      title_es: body.title_es || body.titulo || body.summary || 'Lead WorldModels',
      text_es: body.text_es || body.descripcion || body.summary || body.rawText || '',
      title_en: body.title_en || '',
      text_en: body.text_en || '',
      platform: body.platform || body.plataforma || 'GENERAL',
      urgencia: body.urgencia || 'NORMAL',
      rawText: body.rawText || body.texto_limpio || '',
    };

    // 🔥 PERSISTENCIA EN FIRESTORE
    const { adminDb } = await import('@/lib/firebase-admin');
    const now = new Date().toISOString();

    // 1. Guardar en 'leads' (Vista Muro/Feed)
    const leadData = {
      ...baseLead,
      categoria: baseLead.category, // CLAVE: DASHBOARD BUSCA ESTO
      createdAt: now,
      display_time: now,
      status: 'active',
      titulo: baseLead.title_es, // Sync for dashboard
      descripcion: baseLead.text_es || baseLead.rawText // Fallback to raw if AI empty
    };

    const leadRef = await adminDb.collection('leads').add(leadData);

    // 2. Guardar en 'ofertas' (Vista Categorizada)
    const ofertaRef = await adminDb.collection('ofertas').add({
      ...baseLead,
      categoria: baseLead.category, // Duplicado para compatibilidad
      timestamp: now,
      display_time: now,
      status: 'active'
    });

    console.log('[API-V2] Publicado con éxito:', leadRef.id, ofertaRef.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Lead publicado correctamente en el dashboard',
      ids: { lead: leadRef.id, oferta: ofertaRef.id }
    });

  } catch (error: any) {
    console.error('[API-V2] Error:', error.message);
    return NextResponse.json({ error: 'Error procesando lead' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'API WorldModels V2 Active', version: '1.1' });
}
