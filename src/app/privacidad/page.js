import Link from 'next/link';
import styles from '../legal.module.css';

export default function PrivacidadPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Legal</span>
        <h1>Aviso de privacidad</h1>
        <p>Mazal Time usa tus datos &uacute;nicamente para registrar participaciones, confirmar pagos, contactarte sobre tu compra y coordinar entregas.</p>
        <h2>Datos que podemos solicitar</h2>
        <ul>
          <li>Nombre completo.</li>
          <li>Correo electr&oacute;nico.</li>
          <li>Tel&eacute;fono o WhatsApp.</li>
          <li>N&uacute;meros seleccionados y datos de participaci&oacute;n.</li>
        </ul>
        <h2>Uso de la informaci&oacute;n</h2>
        <p>No vendemos tu informaci&oacute;n. Solo la usamos para operar la rifa, validar boletos y dar seguimiento a ganadores o participantes.</p>
      </article>
    </main>
  );
}
