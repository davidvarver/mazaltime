import styles from './PastRaffles.module.css';
import { formatDateOnly } from '@/lib/dateOnly';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';

export default function PastRaffles({ pastRaffles }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.dividerLine} />
        <h2 className={styles.sectionTitle}>Ganadores Anteriores</h2>
        <div className={styles.dividerLine} />
      </div>

      <div className={styles.grid}>
        {pastRaffles.map((raffle) => {
          const watchTitle = getRaffleWatchTitle(raffle);

          return (
            <div key={raffle.id} className={`${styles.card} glass`}>
              {raffle.imageUrl && (
                <div className={styles.cardImage}>
                  <img src={raffle.imageUrl} alt={watchTitle} />
                </div>
              )}
              <div className={styles.cardHeader}>
                <span className={styles.archiveBadge}>Finalizada</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.watchName}>{watchTitle}</h3>
                <p className={styles.raffleTitle}>{raffle.title}</p>
                <p className={styles.drawDate}>
                  Sorteo: {formatDateOnly(raffle.drawDate)}
                </p>
                <p className={styles.zodiac}>Signo: {raffle.zodiacSign}</p>
              </div>
              {raffle.winningNumber !== null && raffle.winningNumber !== undefined ? (
                <div className={styles.winnerBox}>
                  <span className={styles.winnerLabel}>Número Ganador</span>
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
