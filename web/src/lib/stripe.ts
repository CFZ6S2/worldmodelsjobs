import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 20,
    priceId: process.env.STRIPE_PRICE_BASIC!,
    features: ['20 posts per day', 'City filter', 'Email support'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 30,
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ['Unlimited posts', 'All cities', 'Category filters', 'Priority support'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50,
    priceId: process.env.STRIPE_PRICE_PREMIUM!,
    features: ['Everything in Pro', 'Real-time alerts', 'API access', 'Dedicated support'],
    popular: false,
  },
];
