import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing request body.' });
    }

    if (!data.depositAmount || Number(data.depositAmount) <= 0) {
      return res.status(400).json({
        error: 'Invalid depositAmount.',
        received: data.depositAmount
      });
    }

    if (!data.package) {
      return res.status(400).json({ error: 'Missing package.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${data.package} Package Deposit - Eye Level Mobile`
            },
            unit_amount: Math.round(Number(data.depositAmount) * 100)
          },
          quantity: 1
        }
      ],
      success_url: 'https://eyelevelmobile.com/success',
      cancel_url: 'https://eyelevelmobile.com/cancel',
      customer_email: data.email || undefined,
      metadata: {
        customer_name: data.name || '',
        package: data.package || '',
        route: data.route || '',
        term: data.term || '',
        campaignStart: data.campaignStart || ''
      }
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(400).json({
      error: error.message || 'Stripe session creation failed.'
    });
  }
}
