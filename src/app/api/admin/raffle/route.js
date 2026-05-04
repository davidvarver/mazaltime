import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req) {
  try {
    const data = await req.json();
    const { id, title, watchName, zodiacSign, drawDate, price1, price2, isActive, winningNumber } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID de rifa requerido' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (watchName !== undefined) updateData.watchName = watchName;
    if (zodiacSign !== undefined) updateData.zodiacSign = zodiacSign;
    if (drawDate !== undefined) updateData.drawDate = new Date(drawDate);
    if (price1 !== undefined) updateData.price1 = parseInt(price1, 10);
    if (price2 !== undefined) updateData.price2 = parseInt(price2, 10);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (winningNumber !== undefined) updateData.winningNumber = winningNumber ? parseInt(winningNumber, 10) : null;

    const updatedRaffle = await prisma.raffle.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, raffle: updatedRaffle });
  } catch (error) {
    console.error('Error updating raffle:', error);
    return NextResponse.json({ error: 'Error al actualizar la rifa' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, watchName, zodiacSign, drawDate, price1, price2 } = await req.json();

    // Check if there's already an active raffle
    const activeRaffle = await prisma.raffle.findFirst({
      where: { isActive: true }
    });

    if (activeRaffle) {
      return NextResponse.json({ error: 'Ya existe una rifa activa. Finalízala antes de crear otra.' }, { status: 400 });
    }

    // Use transaction to create raffle and its 100 tickets
    const result = await prisma.$transaction(async (tx) => {
      const newRaffle = await tx.raffle.create({
        data: {
          title,
          watchName,
          zodiacSign,
          drawDate: new Date(drawDate),
          price1: parseInt(price1, 10),
          price2: parseInt(price2, 10),
          isActive: true
        }
      });

      const ticketsData = Array.from({ length: 100 }, (_, i) => ({
        number: i,
        status: 'AVAILABLE',
        raffleId: newRaffle.id
      }));

      await tx.ticket.createMany({
        data: ticketsData
      });

      return newRaffle;
    });

    return NextResponse.json({ success: true, raffle: result });
  } catch (error) {
    console.error('Error creating raffle:', error);
    return NextResponse.json({ error: 'Error al crear la nueva rifa' }, { status: 500 });
  }
}
