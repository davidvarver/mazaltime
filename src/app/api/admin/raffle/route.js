import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthorizedAdmin } from '@/lib/adminGuard';
import { parseDateOnlyForStorage } from '@/lib/dateOnly';
import { composeWatchName } from '@/lib/raffleDisplay';

function parsePositivePrice(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePromoMinTickets(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 2 && parsed <= 100 ? parsed : null;
}

function parseMinSoldPercent(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : null;
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

function normalizeGalleryImages(value) {
  if (!Array.isArray(value)) return [];

  const normalizedImages = [];

  for (const image of value) {
    const normalizedImage = normalizeOptionalUrl(image);
    if (!normalizedImage) return null;
    if (!normalizedImages.includes(normalizedImage)) normalizedImages.push(normalizedImage);
  }

  return normalizedImages.slice(0, 4);
}

export async function PUT(req) {
  try {
    const { error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    const data = await req.json();
    const {
      id,
      title,
      watchBrand,
      watchModel,
      watchName,
      watchDetails,
      zodiacSign,
      drawDate,
      price1,
      price2,
      promoEnabled,
      promoMinTickets,
      minSoldPercent,
      isActive,
      winningNumber,
      imageUrl,
      galleryImages,
      lotteryUrl,
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID de rifa requerido' }, { status: 400 });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (watchBrand !== undefined) updateData.watchBrand = watchBrand?.trim() || null;
    if (watchModel !== undefined) updateData.watchModel = watchModel?.trim() || null;
    if (watchName !== undefined || watchBrand !== undefined || watchModel !== undefined) {
      const nextWatchName = composeWatchName({ watchBrand, watchModel, watchName });
      if (!nextWatchName) return NextResponse.json({ error: 'Marca o modelo del reloj requerido' }, { status: 400 });
      updateData.watchName = nextWatchName;
    }
    if (watchDetails !== undefined) updateData.watchDetails = watchDetails?.trim() || null;
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
      if (!parsedPrice) return NextResponse.json({ error: 'Precio 1 invalido' }, { status: 400 });
      updateData.price1 = parsedPrice;
    }
    if (price2 !== undefined) {
      const parsedPrice = parsePositivePrice(price2);
      if (!parsedPrice) return NextResponse.json({ error: 'Precio promo invalido' }, { status: 400 });
      updateData.price2 = parsedPrice;
    }
    if (promoEnabled !== undefined) updateData.promoEnabled = Boolean(promoEnabled);
    if (promoMinTickets !== undefined) {
      const parsedPromoMinTickets = parsePromoMinTickets(promoMinTickets);
      if (!parsedPromoMinTickets) return NextResponse.json({ error: 'Cantidad minima de promo invalida' }, { status: 400 });
      updateData.promoMinTickets = parsedPromoMinTickets;
    }
    if (minSoldPercent !== undefined) {
      const parsedMinSoldPercent = parseMinSoldPercent(minSoldPercent);
      if (!parsedMinSoldPercent) return NextResponse.json({ error: 'Porcentaje minimo de venta invalido' }, { status: 400 });
      updateData.minSoldPercent = parsedMinSoldPercent;
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
        return NextResponse.json({ error: 'Numero ganador invalido' }, { status: 400 });
      }

      updateData.winningNumber = parsedWinningNumber;
    }
    if (imageUrl !== undefined) {
      const normalizedImageUrl = normalizeOptionalUrl(imageUrl);
      if (imageUrl && !normalizedImageUrl) return NextResponse.json({ error: 'URL de imagen invalida' }, { status: 400 });
      updateData.imageUrl = normalizedImageUrl;
    }
    if (galleryImages !== undefined) {
      const normalizedGalleryImages = normalizeGalleryImages(galleryImages);
      if (!normalizedGalleryImages) return NextResponse.json({ error: 'Galeria de imagenes invalida' }, { status: 400 });
      updateData.galleryImages = normalizedGalleryImages;
    }
    if (lotteryUrl !== undefined) {
      const normalizedLotteryUrl = normalizeOptionalUrl(lotteryUrl);
      if (lotteryUrl && !normalizedLotteryUrl) return NextResponse.json({ error: 'URL de sorteo invalida' }, { status: 400 });
      updateData.lotteryUrl = normalizedLotteryUrl;
    }

    const updatedRaffle = await prisma.raffle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, raffle: updatedRaffle });
  } catch (error) {
    console.error('Error updating raffle:', error);
    return NextResponse.json({ error: 'Error al actualizar la rifa' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    const {
      title,
      watchBrand,
      watchModel,
      watchName,
      watchDetails,
      zodiacSign,
      drawDate,
      price1,
      price2,
      promoEnabled = true,
      promoMinTickets = 2,
      minSoldPercent = 85,
      imageUrl,
      galleryImages,
      lotteryUrl,
    } = await req.json();

    const activeRaffle = await prisma.raffle.findFirst({
      where: { isActive: true },
    });

    if (activeRaffle) {
      return NextResponse.json({ error: 'Ya existe una rifa activa. Finalizala antes de crear otra.' }, { status: 400 });
    }

    const parsedDrawDate = parseDateOnlyForStorage(drawDate);

    if (!parsedDrawDate) {
      return NextResponse.json({ error: 'Fecha de sorteo requerida' }, { status: 400 });
    }

    const parsedPrice1 = parsePositivePrice(price1);
    const parsedPrice2 = parsePositivePrice(price2);
    const parsedPromoMinTickets = parsePromoMinTickets(promoMinTickets);
    const parsedMinSoldPercent = parseMinSoldPercent(minSoldPercent);
    const normalizedImageUrl = normalizeOptionalUrl(imageUrl);
    const normalizedGalleryImages = normalizeGalleryImages(galleryImages || []);
    const normalizedLotteryUrl = normalizeOptionalUrl(lotteryUrl);
    const composedWatchName = composeWatchName({ watchBrand, watchModel, watchName });

    if (!title || !composedWatchName || !zodiacSign || !parsedPrice1 || !parsedPrice2 || !parsedPromoMinTickets || !parsedMinSoldPercent) {
      return NextResponse.json({ error: 'Datos de rifa incompletos o invalidos' }, { status: 400 });
    }

    if (lotteryUrl && !normalizedLotteryUrl) {
      return NextResponse.json({ error: 'URL de sorteo invalida' }, { status: 400 });
    }

    if (imageUrl && !normalizedImageUrl) {
      return NextResponse.json({ error: 'URL de imagen invalida' }, { status: 400 });
    }

    if (!normalizedGalleryImages) {
      return NextResponse.json({ error: 'Galeria de imagenes invalida' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newRaffle = await tx.raffle.create({
        data: {
          title,
          watchBrand: watchBrand?.trim() || null,
          watchModel: watchModel?.trim() || null,
          watchName: composedWatchName,
          watchDetails: watchDetails?.trim() || null,
          zodiacSign,
          drawDate: parsedDrawDate,
          price1: parsedPrice1,
          price2: parsedPrice2,
          promoEnabled: Boolean(promoEnabled),
          promoMinTickets: parsedPromoMinTickets,
          minSoldPercent: parsedMinSoldPercent,
          imageUrl: normalizedImageUrl,
          galleryImages: normalizedGalleryImages,
          lotteryUrl: normalizedLotteryUrl,
          isActive: true,
        },
      });

      const ticketsData = Array.from({ length: 100 }, (_, i) => ({
        number: i,
        status: 'AVAILABLE',
        raffleId: newRaffle.id,
      }));

      await tx.ticket.createMany({
        data: ticketsData,
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
    const { error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

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

