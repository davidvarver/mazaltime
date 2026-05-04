import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Allow this to work even if Stripe key is missing during prototyping
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { raffleId, numbers } = await req.json();

    if (!raffleId || !numbers || numbers.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) {
      return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
    }

    // Verify availability
    const tickets = await prisma.ticket.findMany({
      where: { raffleId, number: { in: numbers } }
    });
    
    const unavailable = tickets.filter(t => t.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'Algunos números ya no están disponibles' }, { status: 400 });
    }

    const unitPrice = numbers.length >= 2 ? raffle.price2 : raffle.price1;

    // If no Stripe key is configured, mock the success behavior for the prototype
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY no está configurada. Simulando pago exitoso.');
      
      // Simulate webhook behavior locally by updating db right away
      await prisma.ticket.updateMany({
        where: { raffleId, number: { in: numbers } },
        data: { status: 'SOLD', userId: session.user.id }
      });
      
      return NextResponse.json({ url: '/mis-boletos?success=true' });
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mis-boletos?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        raffleId: raffle.id,
        numbers: JSON.stringify(numbers),
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Boleto(s) para ${raffle.title}`,
              description: `Números: ${numbers.join(', ')}`,
            },
            unit_amount: unitPrice * 100, // Stripe expects cents
          },
          quantity: numbers.length,
        },
      ],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
