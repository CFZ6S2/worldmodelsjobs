import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(key, {
      // @ts-expect-error - dynamic versioning
      apiVersion: '2024-12-18',
    });
  }
  return stripeInstance;
};

// Also export the instance for legacy compatibility
export const stripe = getStripe();

export const PLANS = [
  {
    id: 'vip',
    name: 'VIP GIRL · WorldModels',
    price: 20,
    priceId: process.env.STRIPE_PRICE_VIP || '',
    features: ['Comentarios privados', 'Verificación VIP', 'Perfil profesional'],
    popular: false,
  },
  {
    id: 'agency',
    name: 'PRO AGENCY · WorldModels',
    price: 50,
    priceId: process.env.STRIPE_PRICE_AGENCY || '',
    features: ['Publicación ilimitada', 'Visibilidad Premium', 'Badge Verificado'],
    popular: true,
  }
];
