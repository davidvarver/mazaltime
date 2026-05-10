import Link from 'next/link';
import styles from '../legal.module.css';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, SITE_URL } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Rifas Rolex en Mexico',
  description: 'Participa en rifas Rolex en Mexico con Mazal Time. Sorteos transparentes, boletos numerados y resultados verificables por Loteria Nacional.',
  path: '/rifas-rolex',
  keywords: ['rifas Rolex Mexico', 'rifa Rolex', 'sorteo Rolex', 'Rolex Sky-Dweller', 'Rolex GMT-Master II'],
});

export default function RifasRolexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Rifas Rolex en Mexico',
    description: 'Guia de Mazal Time para participar en rifas Rolex con resultados verificables.',
    author: { '@type': 'Organization', name: 'Mazal Time' },
    publisher: { '@type': 'Organization', name: 'Mazal Time', logo: { '@type': 'ImageObject', url: `${SITE_URL}/mazal-time-logo.png` } },
    mainEntityOfPage: `${SITE_URL}/rifas-rolex`,
  };

  return (
    <main className={styles.legalPage}>
      <JsonLd data={jsonLd} />
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Rifas Rolex</span>
        <h1>Rifas Rolex en M&eacute;xico</h1>
        <p>
          Mazal Time organiza rifas de relojes Rolex y relojes finos con boletos numerados,
          pagos seguros y resultados verificables. Nuestro objetivo es que cada participante
          pueda elegir sus n&uacute;meros con claridad y revisar la mec&aacute;nica del sorteo antes de comprar.
        </p>
        <h2>&iquest;Por qu&eacute; participar en una rifa Rolex?</h2>
        <p>
          Un reloj Rolex es una pieza de lujo reconocida por su dise&ntilde;o, historia y valor.
          En Mazal Time publicamos la informaci&oacute;n del reloj, precio por boleto, fecha de sorteo
          y regla para determinar al ganador.
        </p>
        <h2>Transparencia del sorteo</h2>
        <p>
          El ganador se determina con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor de la Loter&iacute;a Nacional
          correspondiente a la semana indicada. As&iacute; todos pueden verificar el resultado.
        </p>
        <h2>Participa en la rifa activa</h2>
        <p>
          Revisa la rifa actual, elige n&uacute;meros disponibles y completa tu compra desde la p&aacute;gina principal.
        </p>
        <Link href="/#numeros" className={styles.backLink}>Elegir mis n&uacute;meros</Link>
      </article>
    </main>
  );
}
