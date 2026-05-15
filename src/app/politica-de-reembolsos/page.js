import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Politica de reembolsos',
  description: 'Politica de reembolsos de Mazal Time para boletos de rifas, pagos no completados, cancelaciones y ajustes operativos.',
  path: '/politica-de-reembolsos',
  keywords: ['reembolsos rifas relojes', 'politica reembolso Mazal Time'],
});

export default function RefundPolicyPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Pagos</span>
        <h1>Politica de reembolsos</h1>
        <p>
          Esta politica resume como manejamos aclaraciones de pago y reembolsos. Cada caso se revisa con base en el estado
          real de la transaccion y la rifa correspondiente.
        </p>

        <h2>Pagos no completados</h2>
        <p>
          Si una sesion de Stripe se abandona o no queda pagada, los numeros no se registran como boletos vendidos y no hay
          cargo que reembolsar desde Mazal Time.
        </p>

        <h2>Compras confirmadas</h2>
        <p>
          Una vez confirmada la participacion, el boleto queda asignado a la rifa indicada. Cualquier solicitud de ajuste o
          reembolso debe revisarse antes del sorteo y dependera del estado de la rifa y del metodo de pago utilizado.
        </p>

        <h2>Rifa reprogramada o cancelada</h2>
        <p>
          Si Mazal Time reprograma una rifa por no alcanzar el minimo operativo, se notificara a los participantes por
          los canales registrados y los boletos confirmados conservaran sus numeros para la nueva fecha de referencia.
        </p>
        <p>
          Si una rifa se cancelara definitivamente, se comunicaran las opciones disponibles para los participantes
          confirmados. La revision dependera del estado de la rifa, el metodo de pago utilizado, comisiones aplicables de
          terceros y la informacion necesaria para ubicar la transaccion.
        </p>

        <h2>Aclaraciones</h2>
        <p>
          Para revisar un pago, escribe por WhatsApp con tu nombre, correo, numero de boleto y comprobante o referencia de
          Stripe. Esto nos permite ubicar la operacion con rapidez.
        </p>
      </article>
    </main>
  );
}
