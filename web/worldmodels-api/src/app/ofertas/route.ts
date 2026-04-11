import { NextResponse } from 'next/server';
import { processLead } from '../api/leads/route';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[LEGACY-FORWARD] /ofertas -> processLead');
    
    const result: any = await processLead(body);
    
    if (result.error) {
      const status = result.error === 'SENDER_BANNED' ? 403 : 
                     result.error === 'LEAD_EMPTY_OR_TOO_SHORT' ? 400 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Legacy Endpoint Active', target: '/api/leads' });
}
