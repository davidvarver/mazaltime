import styles from './HeroInfo.module.css';
import Image from 'next/image';

export default function HeroInfo({ raffle }) {
  if (!raffle) return null;

  return (
    <div className={`${styles.heroContainer} glass`}>
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
        <h1 className={`${styles.title} text-gradient`}>{raffle.title}</h1>
        <h2 className={styles.subtitle}>{raffle.watchName}</h2>
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.icon}>🎫</span>
            <p>100 números (00-99)</p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>🏆</span>
            <p>Sorteo: {raffle.zodiacSign} - Lotería Nacional</p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>📅</span>
            <p>Fecha: {new Date(raffle.drawDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.icon}>⚠️</span>
            <p>El sorteo se realizará al vender mínimo el 85%</p>
          </div>
        </div>
        <div className={styles.pricing}>
          <p><span>1 número:</span> ${raffle.price1.toLocaleString()} MXN</p>
          <p><span>2 o más:</span> ${raffle.price2.toLocaleString()} MXN c/u</p>
        </div>
      </div>
    </div>
  );
}
