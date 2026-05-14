import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { releaseExpiredReservations } from '@/lib/ticketReservations';
import { getTicketUnitPrice } from '@/lib/pricing';
import { applyCouponToUnitPrice, isCouponUsable, normalizeCouponCode } from '@/lib/coupons';
import bcrypt from 'bcryptjs';
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

function normalizeTicketNumbers(numbers) {
  if (!Array.isArray(numbers)) return [];

  return [...new Set(numbers.map(Number))]
    .filter(number => Number.isInteger(number) && number >= 0 && number <= 99);
}

async function getOrCreateCheckoutUser(session, customer = {}) {
  if (session?.user?.id) {
    return prisma.user.findUnique({ where: { id: session.user.id } });
  }

  const email = normalizeEmail(customer.email);
  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();
  const password = String(customer.password || '');

  if (!email || !name || !phone) {
    throw new Error('Nombre, correo y WhatsApp son requeridos');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if ((!existingUser.phone && phone) || (!existingUser.name && name)) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...(existingUser.phone ? {} : { phone }),
          ...(existingUser.name ? {} : { name }),
        },
      });
    }

    return existingUser;
  }

  if (password.length < 8) {
    throw new Error('Crea una contraseña de mínimo 8 caracteres para registrar tu cuenta.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
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

    const { raffleId, numbers, customer, couponCode } = await req.json();
    const checkoutUser = await getOrCreateCheckoutUser(session, customer);
    if (!checkoutUser) {
      return NextResponse.json({ error: 'No se pudo preparar el comprador' }, { status: 400 });
    }

    const normalizedNumbers = normalizeTicketNumbers(numbers);

    if (!raffleId || normalizedNumbers.length === 0 || normalizedNumbers.length !== (numbers || []).length) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle || !raffle.isActive) {
      return NextResponse.json({ error: 'Rifa no encontrada o no activa' }, { status: 404 });
    }

    const now = new Date();
    await releaseExpiredReservations(raffleId);

    const originalUnitPrice = getTicketUnitPrice(raffle, normalizedNumbers.length);
    const normalizedCouponCode = normalizeCouponCode(couponCode);
    let coupon = null;

    if (normalizedCouponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } });
      if (!isCouponUsable(coupon)) {
        return NextResponse.json({ error: 'Cupón inválido, vencido o desactivado.' }, { status: 400 });
      }
    }

    const unitPrice = coupon ? applyCouponToUnitPrice(originalUnitPrice, coupon) : originalUnitPrice;
    const appUrl = getAppUrl();

    const previousReservations = await prisma.ticket.findMany({
      where: {
        raffleId,
        number: { in: normalizedNumbers },
        status: 'RESERVED',
        userId: checkoutUser.id,
        stripeSessionId: { not: null },
      },
      select: { stripeSessionId: true },
      distinct: ['stripeSessionId'],
    });

    await Promise.all(previousReservations.map(async ({ stripeSessionId }) => {
      try {
        await stripe.checkout.sessions.expire(stripeSessionId);
      } catch (error) {
        console.warn('No se pudo expirar una sesión anterior de Stripe:', error.message);
      }
    }));

    await prisma.ticket.updateMany({
      where: {
        raffleId,
        number: { in: normalizedNumbers },
        status: 'RESERVED',
        userId: checkoutUser.id,
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'es-419',
      success_url: `${appUrl}/mis-boletos?success=true`,
      cancel_url: `${appUrl}/api/stripe/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: checkoutUser.email,
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60,
      metadata: {
        userId: checkoutUser.id,
        raffleId: raffle.id,
        numbers: JSON.stringify(normalizedNumbers),
        couponCode: coupon?.code || '',
        discountPercent: coupon?.discountPercent ? String(coupon.discountPercent) : '',
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Mazal Time - ${raffle.watchName || raffle.title}`,
              description: [
                `Boleto(s): ${normalizedNumbers.map(number => number.toString().padStart(2, '0')).join(', ')}`,
                coupon ? `Cupón ${coupon.code}: ${coupon.discountPercent}% de descuento` : '',
              ].filter(Boolean).join(' | '),
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
        userId: checkoutUser.id,
        pricePaid: unitPrice,
        couponCode: coupon?.code || null,
        discountPercent: coupon?.discountPercent || null,
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
          couponCode: null,
          discountPercent: null,
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
