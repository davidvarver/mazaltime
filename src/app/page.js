import { prisma } from '@/lib/prisma';
import { ensureDefaultData } from '@/lib/bootstrap';
import { releaseExpiredReservations } from '@/lib/ticketReservations';
import HomeClient from '@/components/HomeClient';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, faqJsonLd, raffleEventJsonLd, SITE_URL } from '@/lib/seo';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';

export const revalidate = 0; // Disable cache for prototype so ticket updates show immediately

export async function generateMetadata() {
  try {
    const activeRaffle = await prisma.raffle.findFirst({ where: { isActive: true } });

    if (!activeRaffle) {
      return buildPageMetadata({
        title: 'Rifas de relojes de lujo en Mexico',
        description: 'Mazal Time organiza rifas de relojes finos y Rolex en Mexico con resultados verificables por Loteria Nacional.',
        path: '/',
      });
    }

    const watchTitle = getRaffleWatchTitle(activeRaffle);

    return buildPageMetadata({
      title: `Rifa ${watchTitle} en Mexico`,
      description: `Participa en la rifa de ${watchTitle} de Mazal Time. Elige tus numeros, compra seguro y consulta el resultado verificable por Loteria Nacional.`,
      path: '/',
      image: activeRaffle.imageUrl || '/rolex-batgirl.png',
      keywords: [watchTitle, `rifa ${watchTitle}`, `rifa ${activeRaffle.watchBrand || 'Rolex'}`],
    });
  } catch (error) {
    console.error('Home metadata error:', error);
    return buildPageMetadata();
  }
}

async function getHomeData() {
  try {
    await ensureDefaultData(prisma);
    await releaseExpiredReservations();

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
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: SITE_URL,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[faqJsonLd(), breadcrumbJsonLd, raffleEventJsonLd(activeRaffle, activeRaffle?.tickets || [], '/')]} />
      <HomeClient
        raffle={activeRaffle}
        initialTickets={activeRaffle?.tickets || []}
        pastRaffles={pastRaffles}
      />
    </>
  );
}
