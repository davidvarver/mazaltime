export const SITE_URL = 'https://mazaltime.com.mx';
export const SITE_NAME = 'Mazal Time';
export const WHATSAPP_PHONE = '+52 55 2313 8175';
export const WHATSAPP_URL = 'https://wa.me/525523138175';

export const SEO_KEYWORDS = [
  'rifas de relojes',
  'rifas de relojes finos',
  'rifas de relojes de lujo',
  'rifas Rolex',
  'rifa Rolex Mexico',
  'sorteos de relojes de lujo',
  'sorteos Rolex Mexico',
  'boletos para rifa Rolex',
  'Mazal Time',
  'MazalTime',
];

export const DEFAULT_DESCRIPTION =
  'Mazal Time organiza rifas y sorteos de relojes de lujo en Mexico. Elige tus numeros, participa con pago seguro y revisa resultados verificables.';

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = '/mazal-time-logo.png',
  keywords = [],
  noIndex = false,
} = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Rifas de relojes de lujo en Mexico`;

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    keywords: [...SEO_KEYWORDS, ...keywords],
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: absoluteUrl(image),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - rifas de relojes de lujo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [absoluteUrl(image)],
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
          },
        },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ['MazalTime', 'Mazal Time Mexico'],
    url: SITE_URL,
    logo: absoluteUrl('/mazal-time-logo.png'),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: WHATSAPP_PHONE,
        areaServed: 'MX',
        availableLanguage: ['es-MX', 'es'],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'es-MX',
  };
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como funciona una rifa de Mazal Time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El participante elige numeros disponibles, registra sus datos y completa el pago. Los boletos vendidos quedan confirmados para el sorteo activo.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como se decide al ganador?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El ganador se determina con los ultimos 2 numeros del Premio Mayor de la Loteria Nacional correspondiente a la semana indicada en la rifa.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como se entrega el reloj?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mazal Time coordina la entrega directamente con el ganador. Puede ser presencial o por envio asegurado segun ubicacion y acuerdo.',
        },
      },
    ],
  };
}

export function raffleEventJsonLd(raffle, tickets = [], path = '/') {
  if (!raffle) return null;

  const name = [raffle.watchBrand, raffle.watchModel].filter(Boolean).join(' ') || raffle.watchName || raffle.title;
  const soldTickets = tickets.filter(ticket => ticket.status === 'SOLD').length;
  const totalTickets = tickets.length || 100;
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Rifa ${name} de Mazal Time`,
    description: raffle.watchDetails || `Rifa de ${name} con boletos numerados del 00 al 99 y resultado verificable por Loteria Nacional.`,
    image: [absoluteUrl(raffle.imageUrl || '/rolex-batgirl.png')],
    startDate: raffle.drawDate,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: raffle.isActive ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCompleted',
    url,
    organizer: { '@id': `${SITE_URL}/#organization` },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: raffle.price1,
      availability: soldTickets >= totalTickets ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      url,
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Boletos totales', value: totalTickets },
      { '@type': 'PropertyValue', name: 'Boletos vendidos', value: soldTickets },
      { '@type': 'PropertyValue', name: 'Resultado verificable', value: 'Loteria Nacional' },
    ],
  };
}

export function raffleTicketProductJsonLd(raffle, tickets = [], path = '/') {
  if (!raffle) return null;

  const name = [raffle.watchBrand, raffle.watchModel].filter(Boolean).join(' ') || raffle.watchName || raffle.title;
  const soldTickets = tickets.filter(ticket => ticket.status === 'SOLD').length;
  const totalTickets = tickets.length || 100;
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Boleto para rifa ${name}`,
    description: `Participacion numerada para la rifa de ${name} en Mazal Time. El premio se define con el resultado verificable de Loteria Nacional indicado en la rifa.`,
    image: [absoluteUrl(raffle.imageUrl || '/rolex-batgirl.png')],
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MXN',
      price: raffle.price1,
      availability: soldTickets >= totalTickets ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Premio', value: name },
      { '@type': 'PropertyValue', name: 'Boletos totales', value: totalTickets },
      { '@type': 'PropertyValue', name: 'Boletos vendidos', value: soldTickets },
    ],
  };
}

export function winnersItemListJsonLd(raffles = [], path = '/ganadores') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ganadores anteriores de Mazal Time',
    url: absoluteUrl(path),
    itemListElement: raffles.map((raffle, index) => {
      const name = [raffle.watchBrand, raffle.watchModel].filter(Boolean).join(' ') || raffle.watchName || raffle.title;

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/sorteos/${raffle.id}`),
        name: `${name} - numero ganador ${raffle.winningNumber ?? 'por anunciar'}`,
      };
    }),
  };
}
