import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const RESERVATION_MINUTES = 31;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe no está configurado en el servidor.' }, { status: 500 });
    }

    const { raffleId, numbers } = await req.json();
    const normalizedNumbers = [...new Set((numbers || []).map(Number))].filter(Number.isInteger);

    if (!raffleId || normalizedNumbers.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle || !raffle.isActive) {
      return NextResponse.json({ error: 'Rifa no encontrada o no activa' }, { status: 404 });
    }

    const now = new Date();
    const reservationCutoff = new Date(now.getTime() - RESERVATION_MINUTES * 60 * 1000);

    await prisma.ticket.updateMany({
      where: {
        raffleId,
        status: 'RESERVED',
        reservedAt: { lt: reservationCutoff },
      },
      data: {
        status: 'AVAILABLE',
        userId: null,
        pricePaid: null,
        stripeSessionId: null,
        reservedAt: null,
      },
    });

    const unitPrice = normalizedNumbers.length >= 2 ? raffle.price2 : raffle.price1;
    const appUrl = getAppUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${appUrl}/mis-boletos?success=true`,
      cancel_url: `${appUrl}/?canceled=true`,
      customer_email: session.user.email,
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
      metadata: {
        userId: session.user.id,
        raffleId: raffle.id,
        numbers: JSON.stringify(normalizedNumbers),
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `${raffle.watchName || raffle.title}`,
              description: `Boleto(s): ${normalizedNumbers.map(number => number.toString().padStart(2, '0')).join(', ')}`,
            },
            unit_amount: unitPrice * 100,
          },
          quantity: normalizedNumbers.length,
        },
      ],
    });

    const reservation = await prisma.ticket.updateMany({
      where: {
        raffleId,
        number: { in: normalizedNumbers },
        status: 'AVAILABLE',
      },
      data: {
        status: 'RESERVED',
        userId: session.user.id,
        pricePaid: unitPrice,
        stripeSessionId: checkoutSession.id,
        reservedAt: now,
      },
    });

    if (reservation.count !== normalizedNumbers.length) {
      await prisma.ticket.updateMany({
        where: { raffleId, stripeSessionId: checkoutSession.id },
        data: {
          status: 'AVAILABLE',
          userId: null,
          pricePaid: null,
          stripeSessionId: null,
          reservedAt: null,
        },
      });

      try {
        await stripe.checkout.sessions.expire(checkoutSession.id);
      } catch (expireError) {
        console.warn('No se pudo expirar la sesión de Stripe:', expireError.message);
      }

      return NextResponse.json({ error: 'Algunos números ya no están disponibles' }, { status: 409 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
