import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { prisma } from '@/lib/prisma';
import { formatDateOnly } from '@/lib/dateOnly';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';
import { buildPageMetadata, raffleEventJsonLd, raffleTicketProductJsonLd } from '@/lib/seo';
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

function isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url || '');
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
  const minSoldPercent = Number.isInteger(Number(raffle.minSoldPercent)) ? Number(raffle.minSoldPercent) : 85;
  const drawDate = formatDateOnly(raffle.drawDate, { day: 'numeric', month: 'long', year: 'numeric' });
  const mediaItems = [raffle.imageUrl || '/rolex-batgirl.png', ...(raffle.galleryImages || [])]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);

  return (
    <main className={styles.page}>
      <JsonLd data={raffleEventJsonLd(raffle, raffle.tickets, `/sorteos/${raffle.id}`)} />
      <JsonLd data={raffleTicketProductJsonLd(raffle, raffle.tickets, `/sorteos/${raffle.id}`)} />
      <article className={styles.card}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>{raffle.isActive ? 'Rifa activa' : 'Rifa finalizada'}</span>
        <div className={styles.heroGrid}>
          <div className={styles.mediaColumn}>
            <div className={styles.imageBox}>
              {isVideoUrl(mediaItems[0]) ? (
                <video src={mediaItems[0]} controls preload="metadata" />
              ) : (
                <Image
                  src={mediaItems[0]}
                  alt={`Rifa ${watchTitle}`}
                  fill
                  sizes="(max-width: 800px) 100vw, 46vw"
                  style={{ objectFit: 'contain' }}
                  unoptimized={mediaItems[0]?.startsWith('http')}
                  priority
                />
              )}
            </div>

            {mediaItems.length > 1 && (
              <div className={styles.gallery} aria-label="Galeria del premio">
                {mediaItems.map((item, index) => (
                  <div key={item} className={styles.galleryItem}>
                    {isVideoUrl(item) ? (
                      <>
                        <video src={item} muted playsInline preload="metadata" />
                        <span>Video</span>
                      </>
                    ) : (
                      <Image
                        src={item}
                        alt={`${watchTitle} foto ${index + 1}`}
                        fill
                        sizes="96px"
                        style={{ objectFit: 'cover' }}
                        unoptimized={item.startsWith('http')}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.copy}>
            <h1>{watchTitle}</h1>
            {raffle.watchDetails && <p className={styles.details}>{raffle.watchDetails}</p>}
            <p className={styles.intro}>
              Participa por un boleto numerado para la rifa de {watchTitle}. En esta pagina puedes revisar el premio,
              fecha, disponibilidad, regla del sorteo y enlaces de referencia antes de elegir tus numeros.
            </p>
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
              <Link href="/ganadores" className={styles.cta}>Ver ganadores anteriores</Link>
            )}
          </div>
        </div>

        <section className={styles.contentGrid}>
          <div>
            <h2>Detalles del premio y autenticidad</h2>
            <p>
              El premio publicado corresponde al reloj indicado en la rifa. Revisa las fotos, videos y descripcion
              disponible antes de participar. Cuando el panel incluye informacion como full set, brand new, referencia,
              medida, brazalete, caja, papeles o factura censurada, esos datos aparecen en esta pagina para evaluar el
              premio con mayor claridad.
            </p>
          </div>
          <div>
            <h2>Compra segura</h2>
            <p>
              Los pagos con tarjeta se procesan mediante Conekta. Mazal Time registra como vendidos solo los boletos con
              pago completado o ventas manuales validadas por el administrador.
            </p>
          </div>
        </section>

        <section className={styles.trustChecklist}>
          <h2>Antes de comprar tu boleto</h2>
          <div className={styles.checkGrid}>
            <div>
              <strong>Premio publicado</strong>
              <span>Modelo, referencia y condicion se muestran segun la informacion cargada en la rifa.</span>
            </div>
            <div>
              <strong>Evidencia del reloj</strong>
              <span>La galeria puede incluir fotos y video del premio; si necesitas mas evidencia, solicitala por WhatsApp.</span>
            </div>
            <div>
              <strong>Resultado verificable</strong>
              <span>La mecanica usa el resultado de Loteria Nacional indicado en la rifa, con liga oficial cuando esta disponible.</span>
            </div>
            <div>
              <strong>Boletos confirmados</strong>
              <span>Solo se consideran vendidos los boletos con pago completado o venta manual validada por administracion.</span>
            </div>
          </div>
        </section>

        <section className={styles.explainer}>
          <h2>&iquest;C&oacute;mo se decide al ganador?</h2>
          <p>
            El ganador se determina con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor de la Loter&iacute;a Nacional
            correspondiente al sorteo indicado. Este mecanismo permite que el resultado sea verificable. Si el minimo de
            {minSoldPercent}% de boletaje no se alcanza antes de la fecha publicada, se comunicara cualquier ajuste conforme a las bases.
          </p>
          <div className={styles.relatedLinks}>
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/bases">Bases del sorteo</Link>
            <Link href="/politica-de-reembolsos">Politica de reembolsos</Link>
            {raffle.lotteryUrl && <a href={raffle.lotteryUrl} target="_blank" rel="noreferrer">Resultado oficial</a>}
          </div>
        </section>
      </article>
    </main>
  );
}
