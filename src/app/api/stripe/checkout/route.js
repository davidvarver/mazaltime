import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { releaseExpiredReservations } from '@/lib/ticketReservations';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Stripe from 'stripe';

const STRIPE_SESSION_MINUTES = 31;

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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function getOrCreateCheckoutUser(session, customer = {}) {
  if (session?.user?.id) {
    return prisma.user.findUnique({ where: { id: session.user.id } });
  }

  const email = normalizeEmail(customer.email);
  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();

  if (!email || !name || !phone) {
    throw new Error('Nombre, correo y WhatsApp son requeridos');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (!existingUser.phone && phone) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { phone },
      });
    }

    return existingUser;
  }

  const temporaryPassword = await bcrypt.hash(crypto.randomUUID(), 10);

  return prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: temporaryPassword,
    },
  });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe no está configurado en el servidor.' }, { status: 500 });
    }

    const { raffleId, numbers, customer } = await req.json();
    const checkoutUser = await getOrCreateCheckoutUser(session, customer);
    if (!checkoutUser) {
      return NextResponse.json({ error: 'No se pudo preparar el comprador' }, { status: 400 });
    }

    const normalizedNumbers = [...new Set((numbers || []).map(Number))].filter(Number.isInteger);

    if (!raffleId || normalizedNumbers.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle || !raffle.isActive) {
      return NextResponse.json({ error: 'Rifa no encontrada o no activa' }, { status: 404 });
    }

    const now = new Date();
    await releaseExpiredReservations(raffleId);

    const unitPrice = normalizedNumbers.length >= 2 ? raffle.price2 : raffle.price1;
    const appUrl = getAppUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'es-419',
      success_url: `${appUrl}/mis-boletos?success=true`,
      cancel_url: `${appUrl}/?canceled=true`,
      customer_email: checkoutUser.email,
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60,
      metadata: {
        userId: checkoutUser.id,
        raffleId: raffle.id,
        numbers: JSON.stringify(normalizedNumbers),
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Mazal Time - ${raffle.watchName || raffle.title}`,
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
    return NextResponse.json({ error: error.message || 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
