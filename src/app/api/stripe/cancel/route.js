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

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const appUrl = getAppUrl();

  if (!sessionId) {
    return NextResponse.redirect(`${appUrl}/?canceled=true`);
  }

  const stripe = getStripe();

  try {
    if (stripe) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (error) {
        console.warn('No se pudo expirar la sesión cancelada:', error.message);
      }
    }

    await prisma.ticket.updateMany({
      where: {
        stripeSessionId: sessionId,
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
  } catch (error) {
    console.error('Error liberando reserva cancelada:', error);
  }

  return NextResponse.redirect(`${appUrl}/?canceled=true`);
}
