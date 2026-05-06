import Link from 'next/link';
import styles from '../legal.module.css';

export default function TerminosPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Legal</span>
        <h1>T&eacute;rminos y condiciones</h1>
        <p>Al participar aceptas las condiciones publicadas para la rifa activa y la verificaci&oacute;n del resultado mediante la Loter&iacute;a Nacional indicada.</p>
        <h2>Disponibilidad</h2>
        <p>Los n&uacute;meros est&aacute;n sujetos a disponibilidad al momento de confirmar la participaci&oacute;n.</p>
        <h2>Pagos y confirmaciones</h2>
        <p>La participaci&oacute;n puede requerir validaci&oacute;n manual o confirmaci&oacute;n del pago antes de quedar registrada como vendida.</p>
        <h2>Cambios operativos</h2>
        <p>Si por causa operativa se requiere ajustar una fecha o mecanismo de confirmaci&oacute;n, se comunicar&aacute; a los participantes por los canales de contacto registrados.</p>
      </article>
    </main>
  );
}
