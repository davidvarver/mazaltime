import bcrypt from 'bcryptjs';

const DEFAULT_ADMINS = [
  { name: 'Moni', username: 'moni', password: 'password123' },
  { name: 'Eliahu', username: 'eliahu', password: 'password123' },
  { name: 'Jaim', username: 'jaim', password: 'password123' },
];

function buildInitialRaffle() {
  return {
    title: 'MAZAL TIME - INFO OFICIAL',
    watchName: 'Rolex GMT-Master II "Batgirl"',
    watchDetails: 'Brand new 2025 full set',
    zodiacSign: 'Sorteo Zodiaco',
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price1: 4200,
    price2: 4000,
    lotteryUrl: '',
    isActive: true,
    tickets: {
      create: Array.from({ length: 100 }, (_, number) => ({
        number,
        status: 'AVAILABLE',
      })),
    },
  };
}

export async function ensureDefaultData(prisma) {
  const allowDefaultSeed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEFAULT_SEED === 'true';
  const adminsWithHashedPasswords = await Promise.all(DEFAULT_ADMINS.map(async (admin) => ({
    ...admin,
    hashedPassword: await bcrypt.hash(admin.password, 10),
  })));

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

    for (const admin of adminsWithHashedPasswords) {
      const existingAdmin = await tx.admin.findUnique({
        where: { username: admin.username },
        select: { id: true, password: true, mustChangePassword: true },
      });

      if (existingAdmin) {
        if (existingAdmin.password === admin.password) {
          await tx.admin.update({
            where: { id: existingAdmin.id },
            data: { password: admin.hashedPassword, mustChangePassword: true },
          });
        }

        continue;
      }

      if (allowDefaultSeed) {
        await tx.admin.create({
          data: {
            name: admin.name,
            username: admin.username,
            password: admin.hashedPassword,
          },
        });
      }
    }

    const activeRaffle = await tx.raffle.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!activeRaffle && allowDefaultSeed) {
      await tx.raffle.create({
        data: buildInitialRaffle(),
      });
    }

    const samplePastRaffle = await tx.raffle.findFirst({
      where: {
        isActive: false,
        watchName: 'Rolex Submariner Date Oyster 41mm 2026',
        title: 'MAZAL TIME - RIFA PASADA',
      },
      select: { id: true },
    });

    if (samplePastRaffle) {
      await tx.ticket.deleteMany({
        where: { raffleId: samplePastRaffle.id },
      });

      await tx.raffle.delete({
        where: { id: samplePastRaffle.id },
      });
    }
  });
}
