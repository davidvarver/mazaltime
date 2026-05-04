const DEFAULT_ADMINS = [
  { name: 'Moni', username: 'moni', password: 'password123' },
  { name: 'Eliahu', username: 'eliahu', password: 'password123' },
  { name: 'Jaim', username: 'jaim', password: 'password123' },
];

function buildInitialRaffle() {
  return {
    title: 'MAZAL TIME - INFO OFICIAL',
    watchName: 'Rolex GMT-Master II "Batgirl"',
    zodiacSign: 'Sorteo Zodiaco',
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price1: 4200,
    price2: 4000,
    isActive: true,
    tickets: {
      create: Array.from({ length: 100 }, (_, number) => ({
        number,
        status: 'AVAILABLE',
      })),
    },
  };
}

function buildSamplePastRaffle() {
  return {
    title: 'MAZAL TIME - RIFA PASADA',
    watchName: 'Rolex Submariner Date Oyster 41mm 2026',
    zodiacSign: 'Libra',
    drawDate: new Date('2026-01-25T12:00:00.000Z'),
    price1: 4200,
    price2: 4000,
    isActive: false,
    winningNumber: 56,
    tickets: {
      create: Array.from({ length: 100 }, (_, number) => ({
        number,
        status: number === 56 ? 'SOLD' : 'AVAILABLE',
      })),
    },
  };
}

export async function ensureDefaultData(prisma) {
  await prisma.$transaction(async (tx) => {
    const oldDani = await tx.admin.findUnique({
      where: { username: 'dani' },
      select: { id: true },
    });

    const existingMoni = await tx.admin.findUnique({
      where: { username: 'moni' },
      select: { id: true },
    });

    if (oldDani && !existingMoni) {
      await tx.admin.update({
        where: { username: 'dani' },
        data: { name: 'Moni', username: 'moni' },
      });
    }

    for (const admin of DEFAULT_ADMINS) {
      await tx.admin.upsert({
        where: { username: admin.username },
        update: {},
        create: admin,
      });
    }

    const activeRaffle = await tx.raffle.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!activeRaffle) {
      await tx.raffle.create({
        data: buildInitialRaffle(),
      });
    }

    const samplePastRaffle = await tx.raffle.findFirst({
      where: {
        isActive: false,
        watchName: 'Rolex Submariner Date Oyster 41mm 2026',
      },
      select: { id: true },
    });

    if (!samplePastRaffle) {
      await tx.raffle.create({
        data: buildSamplePastRaffle(),
      });
    } else {
      await tx.raffle.update({
        where: { id: samplePastRaffle.id },
        data: { zodiacSign: 'Libra', winningNumber: 56 },
      });

      await tx.ticket.updateMany({
        where: { raffleId: samplePastRaffle.id, number: 86 },
        data: { status: 'AVAILABLE' },
      });

      await tx.ticket.updateMany({
        where: { raffleId: samplePastRaffle.id, number: 56 },
        data: { status: 'SOLD' },
      });
    }
  });
}
