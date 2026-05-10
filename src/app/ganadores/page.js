import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { prisma } from '@/lib/prisma';
import { formatDateOnly } from '@/lib/dateOnly';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';
import { buildPageMetadata, winnersItemListJsonLd } from '@/lib/seo';
import styles from './ganadores.module.css';

export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: 'Ganadores anteriores',
  description: 'Consulta ganadores anteriores de Mazal Time: premios, fechas, numeros ganadores y resultados verificables de rifas de relojes de lujo en Mexico.',
  path: '/ganadores',
  keywords: ['ganadores rifas relojes', 'ganadores Rolex Mexico', 'resultados Mazal Time'],
});

function isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url || '');
}

async function getPastRaffles() {
  try {
    return await prisma.raffle.findMany({
      where: { isActive: false },
      orderBy: { drawDate: 'desc' },
      take: 24,
    });
  } catch (error) {
    console.error('Ganadores database error:', error);
    return [];
  }
}

export default async function WinnersPage() {
  const raffles = await getPastRaffles();

  return (
    <main className={styles.page}>
      <JsonLd data={winnersItemListJsonLd(raffles)} />
      <section className={styles.hero}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span>Resultados verificables</span>
        <h1>Ganadores anteriores</h1>
        <p>
          Aqui reunimos rifas finalizadas, numeros ganadores, fechas y enlaces de referencia para que puedas revisar el
          historial de Mazal Time con claridad.
        </p>
      </section>

      {raffles.length > 0 ? (
        <section className={styles.grid} aria-label="Rifas finalizadas">
          {raffles.map((raffle) => {
            const watchTitle = getRaffleWatchTitle(raffle);
            const media = raffle.imageUrl || raffle.galleryImages?.[0];

            return (
              <article key={raffle.id} className={styles.card}>
                {media && (
                  <div className={styles.mediaBox}>
                    {isVideoUrl(media) ? (
                      <video src={media} controls preload="metadata" />
                    ) : (
                      <Image
                        src={media}
                        alt={watchTitle}
                        fill
                        sizes="(max-width: 760px) 100vw, 420px"
                        style={{ objectFit: 'contain' }}
                        unoptimized={media.startsWith('http')}
                      />
                    )}
                  </div>
                )}

                <div className={styles.cardBody}>
                  <span className={styles.status}>Finalizada</span>
                  <h2>{watchTitle}</h2>
                  {raffle.watchDetails && <p className={styles.details}>{raffle.watchDetails}</p>}

                  <dl className={styles.resultList}>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{formatDateOnly(raffle.drawDate, { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                    </div>
                    <div>
                      <dt>Resultado</dt>
                      <dd>{raffle.zodiacSign || 'Sorteo indicado'}</dd>
                    </div>
                    <div>
                      <dt>Numero ganador</dt>
                      <dd>{raffle.winningNumber !== null && raffle.winningNumber !== undefined ? raffle.winningNumber.toString().padStart(2, '0') : 'Por anunciar'}</dd>
                    </div>
                  </dl>

                  <div className={styles.actions}>
                    <Link href={`/sorteos/${raffle.id}`}>Ver detalle</Link>
                    {raffle.lotteryUrl && <a href={raffle.lotteryUrl} target="_blank" rel="noreferrer">Resultado oficial</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>Pronto publicaremos ganadores aqui.</h2>
          <p>Cuando una rifa finalice, veras el premio, fecha, numero ganador y resultado verificable.</p>
          <Link href="/como-funciona">Ver como funciona</Link>
        </section>
      )}
    </main>
  );
}
