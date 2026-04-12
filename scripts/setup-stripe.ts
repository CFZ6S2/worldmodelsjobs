import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from the web directory
const envPath = path.resolve(__dirname, '../web/.env.local');
dotenv.config({ path: envPath });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

async function setup() {
  console.log('Creating Stripe products and prices...');

  const plans = [
    { name: 'LuxFeed Basic', amount: 2000, id: 'BASIC' },
    { name: 'LuxFeed Pro', amount: 3000, id: 'PRO' },
    { name: 'LuxFeed Premium', amount: 5000, id: 'PREMIUM' },
  ];

  const results: Record<string, string> = {};

  for (const plan of plans) {
    try {
      const product = await stripe.products.create({
        name: plan.name,
        description: `Access to ${plan.name} features`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'eur',
        recurring: { interval: 'month' },
      });

      results[`STRIPE_PRICE_${plan.id}`] = price.id;
      console.log(`Created ${plan.name}: ${price.id}`);
    } catch (e: any) {
      console.error(`Error creating ${plan.name}:`, e.message);
    }
  }

  if (Object.keys(results).length > 0) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    for (const [key, value] of Object.entries(results)) {
      envContent = envContent.replace(new RegExp(`${key}=price_...`), `${key}=${value}`);
    }
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with real Price IDs.');
  }
}

setup();
