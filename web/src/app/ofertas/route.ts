import { NextResponse } from 'next/server';
import { processLead } from '@/lib/leads-processor';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'Ofertas endpoint active' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processLead(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
