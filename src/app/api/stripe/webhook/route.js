import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } else {
      // Allow unverified events if secret is not set (e.g. local dev without CLI)
      event = JSON.parse(payload);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    const userId = session.metadata.userId;
    const raffleId = session.metadata.raffleId;
    const numbers = JSON.parse(session.metadata.numbers);

    try {
      await prisma.ticket.updateMany({
        where: {
          raffleId: raffleId,
          number: { in: numbers }
        },
        data: {
          status: 'SOLD',
          userId: userId
        }
      });
      console.log(`Tickets ${numbers.join(', ')} marked as SOLD for user ${userId}`);
    } catch (dbError) {
      console.error('Error updating DB on webhook:', dbError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
