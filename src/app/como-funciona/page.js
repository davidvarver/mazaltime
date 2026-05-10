import Link from 'next/link';
import styles from '../legal.module.css';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, faqJsonLd } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Como funcionan las rifas de Mazal Time',
  description: 'Conoce como participar en Mazal Time: elegir numeros, pagar boletos, verificar el resultado y recibir el reloj si ganas.',
  path: '/como-funciona',
  keywords: ['como funcionan las rifas de relojes', 'como participar en rifa Rolex', 'rifa Loteria Nacional ultimos dos numeros'],
});

export default function ComoFuncionaPage() {
  return (
    <main className={styles.legalPage}>
      <JsonLd data={faqJsonLd()} />
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Gu&iacute;a</span>
        <h1>&iquest;C&oacute;mo funciona Mazal Time?</h1>
        <p>
          Mazal Time es una plataforma de rifas de relojes de lujo. El proceso est&aacute; pensado para que el participante
          pueda elegir sus n&uacute;meros, confirmar su compra y revisar el resultado de forma clara.
        </p>
        <h2>1. Elige tus n&uacute;meros</h2>
        <p>Selecciona uno o varios n&uacute;meros disponibles del 00 al 99 en la rifa activa.</p>
        <h2>2. Completa tu compra</h2>
        <p>Registra tus datos y realiza el pago. Una vez confirmado, tus n&uacute;meros quedan marcados como vendidos.</p>
        <h2>3. Revisa el resultado</h2>
        <p>
          El ganador se define con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor de la Loter&iacute;a Nacional indicado para esa rifa.
        </p>
        <h2>4. Recibe el reloj</h2>
        <p>Coordinamos la entrega directamente con el ganador, ya sea presencial o con env&iacute;o asegurado.</p>
        <Link href="/#numeros" className={styles.backLink}>Participar ahora</Link>
      </article>
    </main>
  );
}
