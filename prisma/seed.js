const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create Admins
  const admins = [
    { name: 'Dani', username: 'dani', password: 'password123' },
    { name: 'Eliahu', username: 'eliahu', password: 'password123' },
    { name: 'Jaim', username: 'jaim', password: 'password123' },
  ]

  for (const admin of admins) {
    await prisma.admin.upsert({
      where: { username: admin.username },
      update: {},
      create: admin,
    })
  }
  
  console.log('Admins seeded successfully.')

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
