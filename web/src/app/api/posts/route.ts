export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const intent = searchParams.get('intent'); 
  const propType = searchParams.get('type');
  const minBudget = parseFloat(searchParams.get('minBudget') || '0');
  const maxBudget = parseFloat(searchParams.get('maxBudget') || '999999999');
  const pageSize = parseInt(searchParams.get('limit') || '20');

  try {
    // Lead Ingestion Reconciliation: Pointing to 'ofertas' and using 'timestamp' for ordering
    let qConstraints: any[] = [orderBy('timestamp', 'desc'), limit(pageSize)];

    if (city && city !== 'All') qConstraints.push(where('ubicacion', '==', city));
    if (category && category !== 'ALL') qConstraints.push(where('categoria', '==', category));
    if (intent) qConstraints.push(where('intent', '==', intent));
    if (propType) qConstraints.push(where('propertyType', '==', propType));
    
    let q = query(collection(db, 'ofertas'), ...qConstraints);

    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Platinum Schema Reconciliation: Map 'ofertas' fields to Dashboard UI expected fields
      return {
        id: doc.id,
        title: data.translations?.es?.titulo || data.titulo || 'Nueva Oferta Platinum',
        description: data.translations?.es?.descripcion || data.descripcion_original || '',
        category: data.categoria || 'VIP',
        city: data.ubicacion || 'Global',
        budget: data.presupuesto || 0,
        source: data.source || data.platform || 'Telegram',
        created_at: data.timestamp || data.createdAt || new Date().toISOString()
      };
    }) as any[];

    // In-memory filter for budget to avoid index complexity for now
    if (minBudget > 0 || maxBudget < 999999999) {
      posts = posts.filter(p => {
        const b = typeof p.budget === 'number' ? p.budget : parseFloat(p.budget);
        if (isNaN(b)) return true;
        return b >= minBudget && b <= maxBudget;
      });
    }

    return NextResponse.json({ posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
