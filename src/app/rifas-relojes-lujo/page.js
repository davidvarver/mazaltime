import Link from 'next/link';
import styles from '../legal.module.css';
import JsonLd from '@/components/JsonLd';
import { buildPageMetadata, SITE_URL } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Rifas de relojes de lujo',
  description: 'Rifas de relojes de lujo en Mexico: Rolex, piezas premium, boletos numerados y sorteos con resultados verificables en Mazal Time.',
  path: '/rifas-relojes-lujo',
  keywords: ['rifas de relojes de lujo', 'rifas de relojes finos', 'sorteos de relojes premium', 'relojes finos Mexico'],
});

export default function RifasRelojesLujoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Rifas de relojes de lujo en Mexico',
    description: 'Mazal Time ofrece sorteos de relojes de lujo con boletos numerados y reglas claras.',
    author: { '@type': 'Organization', name: 'Mazal Time' },
    mainEntityOfPage: `${SITE_URL}/rifas-relojes-lujo`,
  };

  return (
    <main className={styles.legalPage}>
      <JsonLd data={jsonLd} />
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Sorteos premium</span>
        <h1>Rifas de relojes de lujo</h1>
        <p>
          En Mazal Time puedes participar en rifas de relojes de lujo en M&eacute;xico con una experiencia clara:
          publicamos el reloj, fecha del sorteo, precio por n&uacute;mero, boletos disponibles y regla de ganador.
        </p>
        <h2>Relojes finos y piezas premium</h2>
        <p>
          Las rifas pueden incluir Rolex y otros relojes finos. Cada edici&oacute;n muestra la informaci&oacute;n principal
          de la pieza, fotos, detalles y condiciones de participaci&oacute;n.
        </p>
        <h2>Compra de boletos</h2>
        <p>
          El participante elige n&uacute;meros disponibles del 00 al 99 y completa su compra. Los boletos confirmados
          quedan bloqueados para evitar duplicados.
        </p>
        <h2>Resultado verificable</h2>
        <p>
          Usamos una referencia p&uacute;blica de Loter&iacute;a Nacional para que el resultado pueda consultarse de forma independiente.
        </p>
        <Link href="/#rifa-activa" className={styles.backLink}>Ver rifa activa</Link>
      </article>
    </main>
  );
}
