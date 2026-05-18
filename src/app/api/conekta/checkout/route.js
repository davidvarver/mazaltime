import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { releaseExpiredReservations, getReservationExpiresAt } from '@/lib/ticketReservations';
import { getTicketUnitPrice } from '@/lib/pricing';
import { applyCouponToUnitPrice, isCouponUsable, normalizeCouponCode } from '@/lib/coupons';
import { createConektaOrder, createReservationId, isConektaConfigured } from '@/lib/conekta';

export const runtime = 'nodejs';

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

  if (!email) {
    throw new Error('Correo requerido');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const missingUpdates = {
      ...(existingUser.phone || !phone ? {} : { phone }),
      ...(existingUser.name || !name ? {} : { name }),
    };

    if (Object.keys(missingUpdates).length > 0) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: missingUpdates,
      });
    }

    return existingUser;
  }

  if (!name || !phone) {
    throw new Error('Nombre y WhatsApp son requeridos para registrar tu cuenta.');
  }

  if (password.length < 8) {
    throw new Error('Crea una contrasena de minimo 8 caracteres para registrar tu cuenta.');
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

async function releaseReservation(reservationId) {
  return prisma.ticket.updateMany({
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
  const reservationId = createReservationId();

  try {
    const session = await getServerSession(authOptions);

    if (!isConektaConfigured()) {
      return NextResponse.json({ error: 'Conekta no esta configurado en el servidor.' }, { status: 500 });
    }

    const { raffleId, numbers, customer, couponCode } = await req.json();
    const checkoutUser = await getOrCreateCheckoutUser(session, customer);
    if (!checkoutUser) {
      return NextResponse.json({ error: 'No se pudo preparar el comprador' }, { status: 400 });
    }

    const normalizedNumbers = normalizeTicketNumbers(numbers);

    if (!raffleId || normalizedNumbers.length === 0 || normalizedNumbers.length !== (numbers || []).length) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
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
        return NextResponse.json({ error: 'Cupon invalido, vencido o desactivado.' }, { status: 400 });
      }
    }

    const unitPrice = coupon ? applyCouponToUnitPrice(originalUnitPrice, coupon) : originalUnitPrice;

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
        stripeSessionId: reservationId,
        reservedAt: now,
      },
    });

    if (reservation.count !== normalizedNumbers.length) {
      await releaseReservation(reservationId);
      return NextResponse.json({ error: 'Algunos numeros ya no estan disponibles' }, { status: 409 });
    }

    let order;
    try {
      order = await createConektaOrder({
        customer: checkoutUser,
        raffle,
        numbers: normalizedNumbers,
        unitPrice,
        coupon,
        reservationId,
        appUrl: getAppUrl(),
        expiresAt: getReservationExpiresAt(now),
      });
    } catch (conektaError) {
      await releaseReservation(reservationId);
      throw conektaError;
    }

    return NextResponse.json({ url: order.checkout.url });
  } catch (error) {
    console.error('Conekta checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear la orden de pago' }, { status: 500 });
  }
}
