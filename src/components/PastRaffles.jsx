import styles from './PastRaffles.module.css';
import { formatDateOnly } from '@/lib/dateOnly';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';
import Link from 'next/link';
import Image from 'next/image';

export default function PastRaffles({ pastRaffles }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.dividerLine} />
        <h2 className={styles.sectionTitle}>Ganadores anteriores de rifas Rolex</h2>
        <div className={styles.dividerLine} />
      </div>

      <div className={styles.grid}>
        {pastRaffles.map((raffle) => {
          const watchTitle = getRaffleWatchTitle(raffle);

          return (
            <div key={raffle.id} className={`${styles.card} glass`}>
              {raffle.imageUrl && (
                <div className={styles.cardImage}>
                  <Image
                    src={raffle.imageUrl}
                    alt={watchTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, 340px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
              )}
              <div className={styles.cardHeader}>
                <span className={styles.archiveBadge}>Finalizada</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.watchName}>
                  <Link href={`/sorteos/${raffle.id}`}>
                    Ganador {watchTitle} — Sorteo {formatDateOnly(raffle.drawDate)}
                  </Link>
                </h3>
                <p className={styles.raffleTitle}>{raffle.title}</p>
                <p className={styles.drawDate}>
                  Sorteo: {formatDateOnly(raffle.drawDate)}
                </p>
                <p className={styles.zodiac}>Signo: {raffle.zodiacSign}</p>
                <div className={styles.verifyLinks}>
                  <Link href={`/sorteos/${raffle.id}`}>Ver detalle</Link>
                  {raffle.lotteryUrl && (
                    <a href={raffle.lotteryUrl} target="_blank" rel="noreferrer">
                      Resultado oficial
                    </a>
                  )}
                </div>
              </div>
              {raffle.winningNumber !== null && raffle.winningNumber !== undefined ? (
                <div className={styles.winnerBox}>
                  <span className={styles.winnerLabel}>Número ganador</span>
                  <span className={styles.winnerNumber}>
                    {raffle.winningNumber.toString().padStart(2, '0')}
                  </span>
                </div>
              ) : (
                <div className={styles.winnerBox}>
                  <span className={styles.winnerLabel}>Ganador por anunciar</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
