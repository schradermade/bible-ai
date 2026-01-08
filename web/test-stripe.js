// Quick test to verify Stripe config
require('dotenv').config({ path: '.env.local' });

console.log('Environment check:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing');
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? '✓ Set' : '✗ Missing');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? '✓ Set' : '✗ Missing');

if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10',
  });

  console.log('\nTesting Stripe connection...');

  stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
    .then(price => {
      console.log('✓ Successfully connected to Stripe');
      console.log('✓ Price found:', price.id);
      console.log('  Amount:', price.unit_amount / 100, price.currency.toUpperCase());
      console.log('  Interval:', price.recurring?.interval);
    })
    .catch(err => {
      console.log('✗ Stripe error:', err.message);
    });
}
