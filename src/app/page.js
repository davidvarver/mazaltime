import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/HomeClient';

export const revalidate = 0; // Disable cache for prototype so ticket updates show immediately

async function getHomeData() {
  try {
    // Fetch the active raffle and its tickets
    const activeRaffle = await prisma.raffle.findFirst({
      where: { isActive: true },
      include: {
        tickets: {
          select: { number: true, status: true },
          orderBy: { number: 'asc' }
        }
      }
    });

    const pastRaffles = await prisma.raffle.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' }
    });

    return { activeRaffle, pastRaffles };
  } catch (error) {
    console.error('Home page database error:', error);

    return { activeRaffle: null, pastRaffles: [] };
  }
}

export default async function Home() {
  const { activeRaffle, pastRaffles } = await getHomeData();

  return (
    <HomeClient
      raffle={activeRaffle}
      initialTickets={activeRaffle?.tickets || []}
      pastRaffles={pastRaffles}
    />
  );
}
