import Image from 'next/image';
import styles from './HeroInfo.module.css';
import { formatDateOnly } from '@/lib/dateOnly';
import { getPromoLabel, isPromoEnabled } from '@/lib/pricing';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';

function isVideoUrl(url) {
  if (!url) return false;

  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function HeroInfo({ raffle, tickets = [] }) {
  if (!raffle) return null;

  const totalTickets = tickets.length || 100;
  const soldTickets = tickets.filter(ticket => ticket.status === 'SOLD').length;
  const progress = Math.round((soldTickets / totalTickets) * 100);
  const fullDate = formatDateOnly(raffle.drawDate, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const isBatgirl = /batgirl|gmt-master/i.test(raffle.watchName || '');
  const imageSrc = raffle.imageUrl || (isBatgirl ? '/rolex-batgirl.png' : '/rolex_demo.png');
  const watchTitle = getRaffleWatchTitle(raffle);
  const inferredBrand = raffle.watchBrand || (watchTitle.toLowerCase().startsWith('rolex ') ? 'Rolex' : '');
  const inferredModel = raffle.watchModel || (inferredBrand ? watchTitle.replace(new RegExp(`^${inferredBrand}\\s+`, 'i'), '') : watchTitle);
  const galleryImages = Array.isArray(raffle.galleryImages) ? raffle.galleryImages : [];
  const displayImages = [imageSrc, ...galleryImages]
    .filter(Boolean)
    .filter((image, index, images) => images.indexOf(image) === index);

  return (
    <article className={styles.heroContainer}>
      <div className={styles.imageColumn}>
        <div className={styles.imageWrapper}>
          <Image
            src={imageSrc}
            alt={watchTitle}
            fill
            style={{ objectFit: 'contain' }}
            priority
            unoptimized={!!raffle.imageUrl}
          />
          <span className={styles.liveBadge}>Rifa activa</span>
        </div>

        {displayImages.length > 1 && (
          <div className={styles.galleryStrip} aria-label="Fotos del reloj">
            {displayImages.map((image, index) => (
              <div key={image} className={styles.galleryThumb}>
                {isVideoUrl(image) ? (
                  <>
                    <video src={image} muted playsInline preload="metadata" />
                    <span className={styles.videoBadge}>Video</span>
                  </>
                ) : (
                  <Image
                    src={image}
                    alt={`${watchTitle} foto ${index + 1}`}
                    fill
                    sizes="96px"
                    style={{ objectFit: 'cover' }}
                    unoptimized={image.startsWith('http')}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.infoContent}>
        <h2 className={styles.subtitle}>
          {inferredBrand && <span className={styles.watchBrand}>{inferredBrand}</span>}
          <span className={styles.watchModel}>{inferredModel}</span>
        </h2>
        {raffle.watchDetails && (
          <p className={styles.watchDetails}>{raffle.watchDetails}</p>
        )}

        <div className={styles.priceRow}>
          <div>
            <span>Desde</span>
            <strong>${raffle.price1.toLocaleString()} MXN</strong>
            <small>por numero</small>
          </div>
          {isPromoEnabled(raffle) && (
            <div>
              <span>{getPromoLabel(raffle)}</span>
              <strong>${raffle.price2.toLocaleString()} MXN</strong>
              <small>cada uno</small>
            </div>
          )}
        </div>

        <div className={styles.progressArea}>
          <div className={styles.progressLabel}>
            <span>Boletos vendidos</span>
            <strong>{soldTickets}/{totalTickets}</strong>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p>{progress}% vendido</p>
        </div>

        <div className={styles.details}>
          <div>
            <strong>Sorteo</strong>
            {raffle.lotteryUrl ? (
              <a href={raffle.lotteryUrl} target="_blank" rel="noreferrer">
                {raffle.zodiacSign} - Loter&iacute;a Nacional
              </a>
            ) : (
              <span>{raffle.zodiacSign} - Loter&iacute;a Nacional</span>
            )}
          </div>
          <div className={styles.ruleDetail}><strong>Regla</strong><span>El sorteo se realiza al vender m&iacute;nimo el 85%</span></div>
        </div>

        <div className={styles.datePill}>Sorteo: {fullDate}</div>
      </div>
    </article>
  );
}
