import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';

export default async function sitemap() {
  const now = new Date();
  let homeModified = now;

  try {
    const latestRaffle = await prisma.raffle.findFirst({
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    homeModified = latestRaffle?.updatedAt || now;
  } catch (error) {
    console.error('Sitemap database error:', error);
  }

  let raffleRoutes = [];

  try {
    const raffles = await prisma.raffle.findMany({
      select: { id: true, updatedAt: true, isActive: true },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    });

    raffleRoutes = raffles.map(raffle => ({
      url: `${SITE_URL}/sorteos/${raffle.id}`,
      lastModified: raffle.updatedAt,
      changeFrequency: raffle.isActive ? 'daily' : 'monthly',
      priority: raffle.isActive ? 0.9 : 0.65,
    }));
  } catch (error) {
    console.error('Sitemap raffle routes error:', error);
  }

  return [
    {
      url: SITE_URL,
      lastModified: homeModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/rifas-rolex`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/rifas-relojes-lujo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/como-funciona`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/ganadores`,
      lastModified: homeModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/quienes-somos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/bases`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/bases-del-sorteo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/legalidad-del-sorteo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politica-de-privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terminos-y-condiciones`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politica-de-reembolsos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    ...raffleRoutes,
  ];
}
