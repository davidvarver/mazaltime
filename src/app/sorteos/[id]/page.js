import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { prisma } from '@/lib/prisma';
import { formatDateOnly } from '@/lib/dateOnly';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';
import { buildPageMetadata, raffleEventJsonLd } from '@/lib/seo';
import styles from './rafflePage.module.css';

export const revalidate = 300;

async function getRaffle(id) {
  return prisma.raffle.findUnique({
    where: { id },
    include: {
      tickets: {
        select: { number: true, status: true },
        orderBy: { number: 'asc' },
      },
    },
  });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const raffle = await getRaffle(id);

  if (!raffle) return buildPageMetadata({ title: 'Rifa no encontrada', path: `/sorteos/${id}`, noIndex: true });

  const watchTitle = getRaffleWatchTitle(raffle);
  return buildPageMetadata({
    title: `Rifa ${watchTitle}`,
    description: `Detalles de la rifa ${watchTitle} de Mazal Time: boletos numerados, fecha del sorteo, reglas y resultado verificable por Loteria Nacional.`,
    path: `/sorteos/${raffle.id}`,
    image: raffle.imageUrl || '/rolex-batgirl.png',
    keywords: [watchTitle, `rifa ${watchTitle}`, raffle.watchBrand || '', raffle.watchModel || ''].filter(Boolean),
  });
}

export default async function RaffleDetailPage({ params }) {
  const { id } = await params;
  const raffle = await getRaffle(id);

  if (!raffle) notFound();

  const watchTitle = getRaffleWatchTitle(raffle);
  const totalTickets = raffle.tickets.length || 100;
  const soldTickets = raffle.tickets.filter(ticket => ticket.status === 'SOLD').length;
  const availableTickets = totalTickets - soldTickets;
  const drawDate = formatDateOnly(raffle.drawDate, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className={styles.page}>
      <JsonLd data={raffleEventJsonLd(raffle, raffle.tickets, `/sorteos/${raffle.id}`)} />
      <article className={styles.card}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>{raffle.isActive ? 'Rifa activa' : 'Rifa finalizada'}</span>
        <div className={styles.heroGrid}>
          <div className={styles.imageBox}>
            <Image
              src={raffle.imageUrl || '/rolex-batgirl.png'}
              alt={`Rifa ${watchTitle}`}
              fill
              sizes="(max-width: 800px) 100vw, 46vw"
              style={{ objectFit: 'contain' }}
              unoptimized={!!raffle.imageUrl}
              priority
            />
          </div>
          <div className={styles.copy}>
            <h1>{watchTitle}</h1>
            {raffle.watchDetails && <p className={styles.details}>{raffle.watchDetails}</p>}
            <dl className={styles.metaGrid}>
              <div><dt>Fecha del sorteo</dt><dd>{drawDate}</dd></div>
              <div><dt>Precio por boleto</dt><dd>${raffle.price1.toLocaleString()} MXN</dd></div>
              <div><dt>Boletos disponibles</dt><dd>{availableTickets} de {totalTickets}</dd></div>
              <div><dt>Resultado</dt><dd>{raffle.zodiacSign} - Loter&iacute;a Nacional</dd></div>
              {raffle.winningNumber !== null && raffle.winningNumber !== undefined && (
                <div><dt>N&uacute;mero ganador</dt><dd>{raffle.winningNumber.toString().padStart(2, '0')}</dd></div>
              )}
            </dl>
            {raffle.isActive ? (
              <Link href="/#numeros" className={styles.cta}>Elegir n&uacute;meros</Link>
            ) : (
              <Link href="/#ganadores" className={styles.cta}>Ver ganadores anteriores</Link>
            )}
          </div>
        </div>
        <section className={styles.explainer}>
          <h2>&iquest;C&oacute;mo se decide al ganador?</h2>
          <p>
            El ganador se determina con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor de la Loter&iacute;a Nacional
            correspondiente al sorteo indicado. Este mecanismo permite que el resultado sea verificable.
          </p>
        </section>
      </article>
    </main>
  );
}
