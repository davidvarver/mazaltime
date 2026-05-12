import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTicketUnitPrice } from '@/lib/pricing';
import { applyCouponToUnitPrice, isCouponUsable, normalizeCouponCode } from '@/lib/coupons';

function normalizeTicketCount(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : 0;
}

export async function POST(req) {
  try {
    const { code, raffleId, ticketCount } = await req.json();
    const normalizedCode = normalizeCouponCode(code);
    const normalizedCount = normalizeTicketCount(ticketCount);

    if (!normalizedCode) {
      return NextResponse.json({ error: 'Ingresa un cupón.' }, { status: 400 });
    }

    if (!raffleId || !normalizedCount) {
      return NextResponse.json({ error: 'Selecciona números antes de aplicar el cupón.' }, { status: 400 });
    }

    const [raffle, coupon] = await Promise.all([
      prisma.raffle.findUnique({ where: { id: raffleId } }),
      prisma.coupon.findUnique({ where: { code: normalizedCode } }),
    ]);

    if (!raffle || !raffle.isActive) {
      return NextResponse.json({ error: 'Rifa no encontrada o no activa.' }, { status: 404 });
    }

    if (!isCouponUsable(coupon)) {
      return NextResponse.json({ error: 'Cupón inválido, vencido o desactivado.' }, { status: 404 });
    }

    const originalUnitPrice = getTicketUnitPrice(raffle, normalizedCount);
    const discountedUnitPrice = applyCouponToUnitPrice(originalUnitPrice, coupon);
    const originalTotal = originalUnitPrice * normalizedCount;
    const discountedTotal = discountedUnitPrice * normalizedCount;

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        expiresAt: coupon.expiresAt,
      },
      originalUnitPrice,
      discountedUnitPrice,
      originalTotal,
      discountedTotal,
      savings: originalTotal - discountedTotal,
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ error: 'Error al validar el cupón.' }, { status: 500 });
  }
}
