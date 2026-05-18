import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservation_id');
  const appUrl = getAppUrl();

  if (!reservationId) {
    return NextResponse.redirect(`${appUrl}/?canceled=true`);
  }

  try {
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
  } catch (error) {
    console.error('Error liberando reserva cancelada de Conekta:', error);
  }

  return NextResponse.redirect(`${appUrl}/?canceled=true`);
}
