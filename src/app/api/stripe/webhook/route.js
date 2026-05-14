import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

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
  let parsedNumbers = [];

  try {
    parsedNumbers = JSON.parse(session.metadata?.numbers || '[]');
  } catch {
    parsedNumbers = [];
  }

  const numbers = Array.isArray(parsedNumbers)
    ? [...new Set(parsedNumbers.map(Number))]
      .filter(number => Number.isInteger(number) && number >= 0 && number <= 99)
    : [];

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

  // Confirmations are fire-and-forget so Stripe never retries because of email/WhatsApp.
  try {
    const [user, raffle, tickets] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } }),
      prisma.raffle.findUnique({ where: { id: raffleId }, select: { watchName: true } }),
      prisma.ticket.findMany({
        where: { raffleId, number: { in: numbers }, userId },
        select: { pricePaid: true, couponCode: true },
        take: 1,
      }),
    ]);

    if (user && raffle) {
      const pricePaid = tickets[0]?.pricePaid || 0;
      const totalMxn = pricePaid * numbers.length;

      if (user.phone) {
        sendWhatsAppConfirmation({
          buyerName: user.name,
          buyerPhone: user.phone,
          watchName: raffle.watchName,
          numbers,
          totalMxn,
        });
      }

      if (user.email) {
        sendPurchaseConfirmationEmail({
          to: user.email,
          buyerName: user.name,
          watchName: raffle.watchName,
          numbers,
          totalMxn,
          couponCode: tickets[0]?.couponCode || '',
        }).catch(emailErr => {
          console.error('[Email] Error sending purchase confirmation:', emailErr.message);
        });
      }
    }
  } catch (confirmationErr) {
    console.error('[Confirmation] Error preparing data:', confirmationErr.message);
  }
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
      couponCode: null,
      discountPercent: null,
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