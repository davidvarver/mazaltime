import Link from 'next/link';
import Image from 'next/image';
import styles from './compra-exitosa.module.css';

export const metadata = {
  title: 'Compra exitosa | Mazal Time',
  robots: { index: false, follow: false },
};

export default function CompraExitosaPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/mazal-time-logo.png"
          alt="Mazal Time"
          width={320}
          height={100}
          priority
          className={styles.logo}
        />
        <span className={styles.kicker}>Compra exitosa</span>
        <h1>Gracias por participar.</h1>
        <p>
          Tu pago fue recibido. En unos instantes tus numeros quedaran confirmados y te mandaremos
          la confirmacion por correo electronico.
        </p>
        <div className={styles.actions}>
          <Link href="/mis-boletos" className={styles.primary}>Ver mis boletos</Link>
          <Link href="/" className={styles.secondary}>Volver al inicio</Link>
        </div>
        <p className={styles.note}>
          Si compraste sin iniciar sesion, entra con el correo que usaste para revisar tus boletos.
        </p>
      </section>
    </main>
  );
}
