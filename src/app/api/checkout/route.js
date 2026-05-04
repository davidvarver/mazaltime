import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { raffleId, numbers, name, email, phone } = body;

    if (!raffleId || !numbers || !name || !phone) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Wrap in a transaction to prevent race conditions where two users select the same number at the exact same time
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify tickets are still available
      const tickets = await tx.ticket.findMany({
        where: {
          raffleId: raffleId,
          number: { in: numbers }
        }
      });

      const unavailable = tickets.filter(t => t.status !== 'AVAILABLE');
      if (unavailable.length > 0) {
        throw new Error(`Los números ${unavailable.map(t => t.number).join(', ')} ya no están disponibles.`);
      }

      // 2. Mark them as SOLD and attach buyer info
      const updateResult = await tx.ticket.updateMany({
        where: {
          raffleId: raffleId,
          number: { in: numbers }
        },
        data: {
          status: 'SOLD',
          buyerName: name,
          buyerPhone: phone
        }
      });

      return updateResult;
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
