import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { parseDateOnlyForStorage } from '@/lib/dateOnly';

function parsePositivePrice(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOptionalUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function PUT(req) {
  try {
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { id, title, watchName, zodiacSign, drawDate, price1, price2, isActive, winningNumber, imageUrl, lotteryUrl } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID de rifa requerido' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (watchName !== undefined) updateData.watchName = watchName;
    if (zodiacSign !== undefined) updateData.zodiacSign = zodiacSign;
    if (drawDate !== undefined) {
      const parsedDrawDate = parseDateOnlyForStorage(drawDate);

      if (!parsedDrawDate) {
        return NextResponse.json({ error: 'Fecha de sorteo requerida' }, { status: 400 });
      }

      updateData.drawDate = parsedDrawDate;
    }
    if (price1 !== undefined) {
      const parsedPrice = parsePositivePrice(price1);
      if (!parsedPrice) return NextResponse.json({ error: 'Precio 1 inválido' }, { status: 400 });
      updateData.price1 = parsedPrice;
    }
    if (price2 !== undefined) {
      const parsedPrice = parsePositivePrice(price2);
      if (!parsedPrice) return NextResponse.json({ error: 'Precio 2 inválido' }, { status: 400 });
      updateData.price2 = parsedPrice;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (winningNumber !== undefined) {
      const parsedWinningNumber = winningNumber === '' || winningNumber === null
        ? null
        : parseInt(winningNumber, 10);

      if (
        parsedWinningNumber !== null &&
        (!Number.isInteger(parsedWinningNumber) || parsedWinningNumber < 0 || parsedWinningNumber > 99)
      ) {
        return NextResponse.json({ error: 'Número ganador inválido' }, { status: 400 });
      }

      updateData.winningNumber = parsedWinningNumber;
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (lotteryUrl !== undefined) {
      const normalizedLotteryUrl = normalizeOptionalUrl(lotteryUrl);
      if (lotteryUrl && !normalizedLotteryUrl) return NextResponse.json({ error: 'URL de sorteo inválida' }, { status: 400 });
      updateData.lotteryUrl = normalizedLotteryUrl;
    }

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
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, watchName, zodiacSign, drawDate, price1, price2, imageUrl, lotteryUrl } = await req.json();

    // Check if there's already an active raffle
    const activeRaffle = await prisma.raffle.findFirst({
      where: { isActive: true }
    });

    if (activeRaffle) {
      return NextResponse.json({ error: 'Ya existe una rifa activa. Finalízala antes de crear otra.' }, { status: 400 });
    }

    const parsedDrawDate = parseDateOnlyForStorage(drawDate);

    if (!parsedDrawDate) {
      return NextResponse.json({ error: 'Fecha de sorteo requerida' }, { status: 400 });
    }

    const parsedPrice1 = parsePositivePrice(price1);
    const parsedPrice2 = parsePositivePrice(price2);
    const normalizedLotteryUrl = normalizeOptionalUrl(lotteryUrl);

    if (!title || !watchName || !zodiacSign || !parsedPrice1 || !parsedPrice2) {
      return NextResponse.json({ error: 'Datos de rifa incompletos o inválidos' }, { status: 400 });
    }

    if (lotteryUrl && !normalizedLotteryUrl) {
      return NextResponse.json({ error: 'URL de sorteo inválida' }, { status: 400 });
    }

    // Use transaction to create raffle and its 100 tickets
    const result = await prisma.$transaction(async (tx) => {
      const newRaffle = await tx.raffle.create({
        data: {
          title,
          watchName,
          zodiacSign,
          drawDate: parsedDrawDate,
          price1: parsedPrice1,
          price2: parsedPrice2,
          imageUrl: imageUrl || null,
          lotteryUrl: normalizedLotteryUrl,
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

export async function DELETE(req) {
  try {
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de rifa requerido' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 });
    }

    if (raffle.isActive) {
      return NextResponse.json({ error: 'No se puede eliminar una rifa activa' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.deleteMany({
        where: { raffleId: id },
      });

      await tx.raffle.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting raffle:', error);
    return NextResponse.json({ error: 'Error al eliminar la rifa' }, { status: 500 });
  }
}
