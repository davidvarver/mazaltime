import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyConektaWebhookSignature } from '@/lib/conekta';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

export const runtime = 'nodejs';

function parseOrderMetadata(order = {}) {
  const metadata = order.metadata || {};
  const userId = metadata.userId;
  const raffleId = metadata.raffleId;
  const reservationId = metadata.reservationId || order.id;
  let parsedNumbers = [];

  try {
    parsedNumbers = JSON.parse(metadata.numbers || '[]');
  } catch {
    parsedNumbers = [];
  }

  const numbers = Array.isArray(parsedNumbers)
    ? [...new Set(parsedNumbers.map(Number))]
      .filter(number => Number.isInteger(number) && number >= 0 && number <= 99)
    : [];

  return { userId, raffleId, reservationId, numbers };
}

async function markTicketsSold(order) {
  const { userId, raffleId, reservationId, numbers } = parseOrderMetadata(order);

  if (!userId || !raffleId || !reservationId || numbers.length === 0) {
    throw new Error('Webhook Conekta sin metadata completa');
  }

  await prisma.ticket.updateMany({
    where: {
      raffleId,
      number: { in: numbers },
      stripeSessionId: reservationId,
      status: 'RESERVED',
    },
    data: {
      status: 'SOLD',
      userId,
      reservedAt: null,
    },
  });

  // Confirmations are fire-and-forget so Conekta never retries because of email/WhatsApp.
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

async function releaseReservedTickets(order) {
  const { reservationId } = parseOrderMetadata(order);

  if (!reservationId) return;

  await prisma.ticket.updateMany({
    where: {
      stripeSessionId: reservationId,
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
  const payload = await req.text();
  const digest = req.headers.get('digest') || req.headers.get('x-conekta-signature');

  if (!verifyConektaWebhookSignature(payload, digest)) {
    return NextResponse.json({ error: 'Firma invalida' }, { status: 400 });
  }

  let event;

  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const eventType = event.type;
  const order = event.data?.object || event.data || event.object || {};

  try {
    if (eventType === 'order.paid') {
      await markTicketsSold(order);
    }

    if (['order.canceled', 'order.expired', 'order.payment_failed', 'charge.failed'].includes(eventType)) {
      await releaseReservedTickets(order);
    }
  } catch (error) {
    console.error('Error procesando webhook de Conekta:', error);
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
