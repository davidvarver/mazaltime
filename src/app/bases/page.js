import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Bases del sorteo',
  description: 'Consulta las bases de participacion de Mazal Time: boletos, confirmacion de pago, seleccion del ganador y entrega del reloj.',
  path: '/bases',
  keywords: ['bases rifa relojes', 'reglas sorteo Rolex', 'bases Mazal Time'],
});

export default function BasesPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Legal</span>
        <h1>Bases del sorteo</h1>
        <p>Estas bases resumen la forma de participaci&oacute;n en las rifas activas de Mazal Time.</p>
        <h2>Participaci&oacute;n</h2>
        <ul>
          <li>El participante elige uno o varios n&uacute;meros disponibles del 00 al 99.</li>
          <li>La participaci&oacute;n queda confirmada una vez registrado el pago o confirmaci&oacute;n correspondiente.</li>
          <li>Los n&uacute;meros vendidos no pueden ser seleccionados por otro participante.</li>
        </ul>
        <h2>Ganador</h2>
        <p>El ganador se determina con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor de la Loter&iacute;a Nacional correspondiente a la semana indicada en la rifa.</p>
        <h2>Entrega</h2>
        <p>La entrega se coordina directamente con el ganador, ya sea presencial o por env&iacute;o asegurado seg&uacute;n ubicaci&oacute;n y acuerdo.</p>
      </article>
    </main>
  );
}
