import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata, WHATSAPP_URL } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Quienes somos',
  description: 'Conoce Mazal Time, una marca enfocada en rifas de relojes premium en Mexico con pagos seguros, resultados verificables y atencion directa.',
  path: '/quienes-somos',
  keywords: ['Mazal Time Mexico', 'rifas de relojes premium Mexico', 'rifas Rolex confiables'],
});

export default function QuienesSomosPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Marca y confianza</span>
        <h1>Quienes somos</h1>
        <p>
          Mazal Time es una marca enfocada en rifas de relojes premium en Mexico. Nuestro objetivo es que cada
          participante pueda revisar el premio, elegir sus numeros, pagar de forma segura y consultar una mecanica de
          resultado verificable antes de participar.
        </p>

        <h2>Que hacemos</h2>
        <p>
          Publicamos rifas con boletos numerados, informacion del reloj, fecha de referencia, regla de seleccion del
          ganador y canales oficiales de contacto. Los pagos con tarjeta se procesan mediante Conekta y los boletos se
          confirman cuando el pago queda completado o cuando una venta manual es validada por administracion.
        </p>

        <h2>Transparencia del sorteo</h2>
        <p>
          Cuando una rifa usa Loteria Nacional como referencia, la pagina muestra el tipo de sorteo y, si esta
          disponible, la liga al resultado oficial. La mecanica general toma los ultimos 2 numeros del Premio Mayor del
          sorteo indicado, salvo que las bases particulares de una rifa especifiquen algo distinto.
        </p>

        <h2>Antes de participar</h2>
        <p>
          Te recomendamos revisar las bases, terminos, politica de privacidad y politica de reembolsos. Si tienes una
          duda sobre el premio, la entrega o la mecanica, puedes contactarnos por WhatsApp antes de comprar.
        </p>

        <h2>Contacto oficial</h2>
        <p>
          El canal principal de atencion es WhatsApp. Desde ahi podemos apoyar con dudas sobre numeros, pagos, entrega
          del premio y seguimiento de una participacion.
        </p>
        <p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contactar a Mazal Time por WhatsApp
          </a>
        </p>
      </article>
    </main>
  );
}
