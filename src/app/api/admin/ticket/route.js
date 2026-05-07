import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

export async function POST(req) {
  try {
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { raffleId, numbers, status, adminId, buyerName, buyerPhone } = body;
    const allowedStatuses = new Set(['AVAILABLE', 'SOLD']);

    if (!raffleId || !numbers || !Array.isArray(numbers) || numbers.length === 0 || !status || !adminId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: 'Estado no permitido' }, { status: 400 });
    }

    const normalizedNumbers = [...new Set(numbers.map(number => parseInt(number, 10)))]
      .filter(number => Number.isInteger(number) && number >= 0 && number <= 99);

    if (normalizedNumbers.length !== numbers.length) {
      return NextResponse.json({ error: 'Todos los números deben estar entre 0 y 99' }, { status: 400 });
    }

    // Require buyer info when marking as SOLD
    if (status === 'SOLD' && (!buyerName || !buyerPhone)) {
      return NextResponse.json({ error: 'El nombre y teléfono del comprador son requeridos' }, { status: 400 });
    }

    // Get raffle for pricing
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });

    // Calculate price per ticket (group discount if 2+)
    const pricePaid = status === 'SOLD'
      ? (numbers.length >= 2 ? raffle.price2 : raffle.price1)
      : null;

    const updateData = {
      status,
      admin: { connect: { id: adminId } },
    };

    if (status === 'SOLD') {
      updateData.buyerName = buyerName;
      updateData.buyerPhone = buyerPhone;
      updateData.pricePaid = pricePaid;
    }

    if (status === 'AVAILABLE') {
      updateData.user = { disconnect: true };
      updateData.buyerName = null;
      updateData.buyerPhone = null;
      updateData.pricePaid = null;
      updateData.stripeSessionId = null;
      updateData.reservedAt = null;
    }

    // Update all numbers in one transaction
    const updatedTickets = await prisma.$transaction(
      normalizedNumbers.map(number =>
        prisma.ticket.update({
          where: { raffleId_number: { raffleId, number } },
          data: updateData,
          include: { admin: true, user: true }
        })
      )
    );

    return NextResponse.json({ tickets: updatedTickets });
  } catch (error) {
    console.error('Admin update error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
