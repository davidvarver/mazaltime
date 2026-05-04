const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create Admins
  const admins = [
    { name: 'Moni', username: 'moni', password: 'password123' },
    { name: 'Eliahu', username: 'eliahu', password: 'password123' },
    { name: 'Jaim', username: 'jaim', password: 'password123' },
  ]

  const oldDani = await prisma.admin.findUnique({
    where: { username: 'dani' },
  })

  const existingMoni = await prisma.admin.findUnique({
    where: { username: 'moni' },
  })

  if (oldDani && !existingMoni) {
    await prisma.admin.update({
      where: { username: 'dani' },
      data: { name: 'Moni', username: 'moni' },
    })
  }

  for (const admin of admins) {
    await prisma.admin.upsert({
      where: { username: admin.username },
      update: {},
      create: admin,
    })
  }
  
  console.log('Admins seeded successfully.')

  const samplePastRaffle = await prisma.raffle.findFirst({
    where: {
      isActive: false,
      watchName: 'Rolex Submariner Date Oyster 41mm 2026',
    },
  })

  if (!samplePastRaffle) {
    await prisma.raffle.create({
      data: {
        title: 'MAZAL TIME - RIFA PASADA',
        watchName: 'Rolex Submariner Date Oyster 41mm 2026',
        zodiacSign: 'Libra',
        drawDate: new Date('2026-01-25T12:00:00.000Z'),
        price1: 4200,
        price2: 4000,
        isActive: false,
        winningNumber: 56,
        tickets: {
          create: Array.from({ length: 100 }).map((_, i) => ({
            number: i,
            status: i === 56 ? 'SOLD' : 'AVAILABLE'
          }))
        }
      }
    })

    console.log('Sample past raffle created successfully.')
  } else {
    await prisma.raffle.update({
      where: { id: samplePastRaffle.id },
      data: { zodiacSign: 'Libra', winningNumber: 56 },
    })

    await prisma.ticket.updateMany({
      where: { raffleId: samplePastRaffle.id, number: 86 },
      data: { status: 'AVAILABLE' },
    })

    await prisma.ticket.updateMany({
      where: { raffleId: samplePastRaffle.id, number: 56 },
      data: { status: 'SOLD' },
    })
  }

  const existingActiveRaffle = await prisma.raffle.findFirst({
    where: { isActive: true },
  })

  if (existingActiveRaffle) {
    console.log('Active raffle already exists. Skipping initial raffle seed.')
    return
  }

  // Create an initial active raffle
  await prisma.raffle.create({
    data: {
      title: 'MAZAL TIME - INFO OFICIAL',
      watchName: 'Rolex GMT-Master II "Batgirl"',
      zodiacSign: 'Sorteo Zodiaco',
      drawDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      price1: 4200,
      price2: 4000,
      isActive: true,
      tickets: {
        create: Array.from({ length: 100 }).map((_, i) => ({
          number: i,
          status: 'AVAILABLE'
        }))
      }
    }
  })

  console.log('Initial raffle created successfully.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
