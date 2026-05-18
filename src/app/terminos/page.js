import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Terminos y condiciones',
  description: 'Terminos de Mazal Time para boletos, pagos, confirmacion, rifas de relojes de lujo y entrega de premios en Mexico.',
  path: '/terminos',
  keywords: ['terminos rifas relojes', 'condiciones Mazal Time', 'rifas Rolex Mexico'],
});

export default function TerminosPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Condiciones</span>
        <h1>Terminos y condiciones</h1>
        <p>
          Al participar aceptas las condiciones publicadas para la rifa activa, las bases generales del sorteo y la
          verificacion del resultado mediante la Loteria Nacional indicada.
        </p>

        <h2>Compra y disponibilidad</h2>
        <p>
          Los numeros estan sujetos a disponibilidad al momento de confirmar la compra. Seleccionar numeros en pantalla no
          garantiza la participacion hasta que el pago se complete o un administrador confirme la venta manual.
        </p>

        <h2>Pagos</h2>
        <p>
          Los pagos con tarjeta se procesan mediante Conekta. Mazal Time no almacena datos completos de tarjetas bancarias.
          Si una sesion de pago no se completa, los numeros no deben considerarse vendidos.
        </p>

        <h2>Comunicaciones</h2>
        <p>
          Podemos contactarte por correo, telefono o WhatsApp para confirmar boletos, resolver dudas, solicitar datos de
          entrega o comunicar cambios operativos relacionados con una rifa.
        </p>

        <h2>Cambios operativos</h2>
        <p>
          Si por causa operativa se requiere ajustar una fecha, liga de resultado o forma de confirmacion, se comunicara
          con anticipacion razonable a los participantes afectados por los canales registrados.
        </p>

        <h2>Uso responsable</h2>
        <p>
          El participante declara que la informacion proporcionada es verdadera y que participa de forma voluntaria. Mazal
          Time puede rechazar operaciones sospechosas, duplicadas o con informacion insuficiente.
        </p>
      </article>
    </main>
  );
}
