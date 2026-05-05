import Image from 'next/image';
import styles from './HeroInfo.module.css';

export default function HeroInfo({ raffle, tickets = [] }) {
  if (!raffle) return null;

  const totalTickets = tickets.length || 100;
  const availableTickets = tickets.filter(ticket => ticket.status === 'AVAILABLE').length;
  const soldTickets = Math.max(totalTickets - availableTickets, 0);
  const progress = Math.round((soldTickets / totalTickets) * 100);
  const drawDate = new Date(raffle.drawDate);
  const shortDate = drawDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const fullDate = drawDate.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`${styles.heroContainer} glass`}>
      <div className={styles.heroHeader}>
        <div>
          <p className={styles.eyebrow}>Rifa activa</p>
          <h1 className={styles.title}>{raffle.title}</h1>
          <p className={styles.dateLine}>{fullDate}</p>
        </div>
        <div className={styles.progressBlock}>
          <div className={styles.progressTrack}>
            <span style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <strong>{progress}% vendido</strong>
        </div>
      </div>

      <div className={styles.imageWrapper}>
        <Image
          src={raffle.imageUrl || '/rolex_demo.png'}
          alt={raffle.watchName}
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized={!!raffle.imageUrl}
        />
      </div>

      <div className={styles.infoContent}>
        <h2 className={styles.subtitle}>{raffle.watchName}</h2>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.icon}>🎫</span>
            <p>{totalTickets} números (00-99)</p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>🏆</span>
            <p>Sorteo: {raffle.zodiacSign} - Lotería Nacional</p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>📅</span>
            <p>
              Fecha:{' '}
              {drawDate.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>⚠️</span>
            <p>El sorteo se realizará al vender mínimo el 85%</p>
          </div>
        </div>

        <div className={styles.statsBar}>
          <div>
            <strong>{availableTickets}</strong>
            <span>Disponibles</span>
          </div>
          <div>
            <strong>${raffle.price1.toLocaleString()}</strong>
            <span>Por número</span>
          </div>
          <div>
            <strong>{shortDate}</strong>
            <span>Sorteo</span>
          </div>
        </div>

        <div className={styles.pricing}>
          <p><span>2 o más:</span> ${raffle.price2.toLocaleString()} MXN c/u</p>
        </div>
      </div>
    </div>
  );
}
