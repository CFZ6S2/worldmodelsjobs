import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - version 2024-12-18 is valid but type definitions might be out of sync
  apiVersion: '2024-12-18',
});

const SUCCESS_URL = 'https://worldmodels-jobs.web.app/es/feed?upgraded=true';
const CANCEL_URL  = 'https://worldmodels-jobs.web.app/es/feed';

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://worldmodels-jobs.web.app';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Vary': 'Origin',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { uid, email, plan = 'agency' } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'uid and email are required' }, { status: 400, headers: corsHeaders });
    }

    // Configuración del producto según el plan
    const isVip = plan === 'vip';
    const unitAmount = isVip ? 2000 : 5000; // 20€ para VIP, 50€ para Agency
    const productName = isVip ? 'VIP GIRL · WorldModels' : 'PRO AGENCY · WorldModels';
    const productDesc = isVip 
      ? 'Acceso a comentarios de plazas, verificación VIP y perfil profesional.' 
      : 'Publica plazas y eventos en el feed. Visibilidad premium + badge verificado.';

    // Look up or create a Stripe customer keyed to the Firebase UID
    const existing = await stripe.customers.search({
      query: `metadata['firebase_uid']:'${uid}'`,
      limit: 1,
    });

    let customer: Stripe.Customer;
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { firebase_uid: uid },
      });
    }

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            recurring: { interval: 'month' },
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: { 
        firebase_uid: uid,
        plan: plan 
      },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      locale: 'es',
    });

    return NextResponse.json({ sessionUrl: session.url }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Checkout Error]', message);
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
