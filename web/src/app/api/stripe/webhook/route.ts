import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - version 2024-12-18 is valid but type definitions might be out of sync
  apiVersion: '2024-12-18',
});


export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature error';
    console.error('[Stripe Webhook] Signature error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { adminDb } = await import('@/lib/firebase-admin');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.firebase_uid;
        const plan = session.metadata?.plan || 'agency';
        if (!uid) break;

        const updateData: any = {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
          lastBillingEvent: new Date().toISOString(),
        };

        if (plan === 'vip') {
          updateData.isVip = true;
          updateData.vipActivatedAt = new Date().toISOString();
        } else {
          updateData.proAgency = true;
          updateData.proAgencyActivatedAt = new Date().toISOString();
        }

        await adminDb.collection('profiles').doc(uid).set(updateData, { merge: true });
        console.log(`[Stripe] ${plan.toUpperCase()} activado para uid=${uid}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const uid = subscription.metadata?.firebase_uid || customer.metadata?.firebase_uid;
        const plan = subscription.metadata?.plan || 'agency';

        if (!uid) break;

        const updateData: any = {
          subscriptionStatus: 'canceled',
          revokedAt: new Date().toISOString(),
        };

        if (plan === 'vip') {
          updateData.isVip = false;
        } else {
          updateData.proAgency = false;
        }

        await adminDb.collection('profiles').doc(uid).set(updateData, { merge: true });
        console.log(`[Stripe] ${plan.toUpperCase()} revocado para uid=${uid}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const uid = subscription.metadata?.firebase_uid || customer.metadata?.firebase_uid;
        const plan = subscription.metadata?.plan || 'agency';
        
        if (!uid) break;

        const isActive = ['active', 'trialing'].includes(subscription.status);
        const updateData: any = {
          subscriptionStatus: subscription.status,
        };

        if (plan === 'vip') {
          updateData.isVip = isActive;
        } else {
          updateData.proAgency = isActive;
        }

        await adminDb.collection('profiles').doc(uid).set(updateData, { merge: true });
        console.log(`[Stripe] Subscription update uid=${uid} status=${subscription.status} ${plan}=${isActive}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown processing error';
    console.error('[Stripe Webhook] Error processing event:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
