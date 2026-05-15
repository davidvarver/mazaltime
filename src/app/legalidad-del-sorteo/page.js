import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata, WHATSAPP_URL } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Legalidad del sorteo',
  description: 'Informacion de transparencia de Mazal Time sobre bases, mecanica del ganador, minimo de boletaje, pagos y entrega de premios.',
  path: '/legalidad-del-sorteo',
  keywords: ['legalidad sorteo Rolex', 'bases sorteo relojes Mexico', 'rifas transparentes Mexico'],
});

export default function LegalidadSorteoPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Transparencia</span>
        <h1>Legalidad del sorteo</h1>
        <p>
          Esta pagina resume los puntos que todo participante debe poder revisar antes de comprar un boleto: quien opera
          la rifa, como se confirma una participacion, como se elige al ganador y que ocurre si la rifa requiere un ajuste
          operativo.
        </p>

        <h2>Canales y responsable operativo</h2>
        <p>
          Mazal Time publica la rifa activa, registra boletos confirmados, da seguimiento por los canales oficiales y
          coordina la entrega del premio con el ganador. Si necesitas datos adicionales del responsable operativo o
          documentacion disponible de una rifa, solicitalos antes de participar.
        </p>

        <h2>Mecanica verificable</h2>
        <p>
          Salvo que la rifa indique una regla distinta, el ganador se define con los ultimos 2 numeros del Premio Mayor de
          la Loteria Nacional correspondiente al sorteo publicado. Cuando exista liga oficial, se mostrara en la pagina de
          la rifa para que el resultado pueda revisarse.
        </p>

        <h2>Minimo de boletaje</h2>
        <p>
          La rifa se realiza al alcanzar el minimo operativo publicado. Si no se alcanza antes de la fecha de referencia,
          Mazal Time podra reprogramar la rifa o comunicar una solucion equivalente a los participantes registrados,
          conforme a las bases y politica de reembolsos.
        </p>

        <h2>Pagos y boletos confirmados</h2>
        <p>
          Los boletos quedan confirmados cuando el pago se completa correctamente o cuando una venta manual es validada
          por administracion. Una sesion de pago abandonada no debe considerarse como boleto vendido.
        </p>

        <h2>Preguntas antes de comprar</h2>
        <p>
          Si quieres confirmar una regla, revisar evidencia del premio o pedir informacion adicional, contacta a Mazal
          Time antes de participar.
        </p>
        <p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contactar por WhatsApp
          </a>
        </p>
      </article>
    </main>
  );
}
