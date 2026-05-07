import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

function parseSessionMetadata(session) {
  const userId = session.metadata?.userId;
  const raffleId = session.metadata?.raffleId;
  const numbers = JSON.parse(session.metadata?.numbers || '[]');

  return { userId, raffleId, numbers };
}

async function markTicketsSold(session) {
  const { userId, raffleId, numbers } = parseSessionMetadata(session);

  if (!userId || !raffleId || numbers.length === 0) {
    throw new Error('Webhook sin metadata completa');
  }

  await prisma.ticket.updateMany({
    where: {
      raffleId,
      number: { in: numbers },
      stripeSessionId: session.id,
      status: 'RESERVED',
    },
    data: {
      status: 'SOLD',
      userId,
      reservedAt: null,
    },
  });
}

async function releaseReservedTickets(session) {
  await prisma.ticket.updateMany({
    where: {
      stripeSessionId: session.id,
      status: 'RESERVED',
    },
    data: {
      status: 'AVAILABLE',
      userId: null,
      pricePaid: null,
      stripeSessionId: null,
      reservedAt: null,
    },
  });
}

export async function POST(req) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!stripe || !endpointSecret) {
    console.error('Stripe webhook no configurado. Faltan STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET.');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await markTicketsSold(event.data.object);
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      await releaseReservedTickets(event.data.object);
    }
  } catch (error) {
    console.error('Error procesando webhook de Stripe:', error);
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
