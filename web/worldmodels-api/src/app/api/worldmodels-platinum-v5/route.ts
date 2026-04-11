import { NextResponse } from 'next/server';
import { processLead } from '@/lib/leads-processor';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://worldmodels-jobs.web.app';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Vary': 'Origin'
};

const limitMap = new Map<string, { c: number; t: number }>();
function limited(key: string, max: number, win: number) {
  const now = Date.now();
  const rec = limitMap.get(key);
  if (!rec || now - rec.t > win) {
    limitMap.set(key, { c: 1, t: now });
    return false;
  }
  if (rec.c >= max) return true;
  rec.c += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const k = `${ip}:${apiKey}`;
    if (limited(k, 60, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const result: any = await processLead(body);

    if (result.error) {
      const status = (result.error === 'SENDER_BANNED' || result.error === 'LEAD_BANNED_CONTENT') ? 403 :
                     result.error === 'LEAD_EMPTY_OR_TOO_SHORT' ? 400 : 500;
      return NextResponse.json(result, { status, headers: CORS_HEADERS });
    }
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Platinum Stable API Active', version: '5.0.1', endpoint: '/api/worldmodels-platinum-v5' }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
