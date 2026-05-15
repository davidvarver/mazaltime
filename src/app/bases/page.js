import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Bases del sorteo',
  description: 'Bases de participacion de Mazal Time: boletos, pago, fecha, seleccion del ganador por Loteria Nacional y entrega del premio.',
  path: '/bases',
  keywords: ['bases rifa relojes', 'reglas sorteo Rolex', 'bases Mazal Time', 'rifas transparentes Mexico'],
});

export default function BasesPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Bases oficiales</span>
        <h1>Bases del sorteo</h1>
        <p>
          Estas bases explican el formato general de participacion en Mazal Time. Cada rifa activa puede incluir
          detalles propios como fecha, precio, cantidad de boletos, premio y liga al resultado verificable.
        </p>

        <h2>Responsable del sorteo</h2>
        <p>
          Mazal Time administra la publicacion de rifas, registro de boletos, confirmacion de pagos y seguimiento
          con participantes por los canales oficiales publicados en el sitio. Los datos operativos y fiscales aplicables
          pueden solicitarse por los canales oficiales antes de participar.
        </p>

        <h2>Participacion</h2>
        <ul>
          <li>El participante elige uno o varios numeros disponibles del 00 al 99.</li>
          <li>La participacion queda confirmada cuando el pago aparece como completado o cuando un administrador registra una venta manual validada.</li>
          <li>Los numeros confirmados no pueden ser seleccionados por otro participante.</li>
          <li>El participante debe proporcionar datos de contacto correctos para recibir avisos y confirmacion.</li>
        </ul>

        <h2>Fecha, minimo de boletaje y ajustes</h2>
        <p>
          La fecha publicada en cada rifa es la referencia principal. La rifa se realiza al vender el minimo operativo
          indicado en la pagina del sorteo. Si no se alcanza ese minimo antes de la fecha publicada, Mazal Time podra
          reprogramar la rifa al siguiente sorteo de referencia disponible o comunicar una solucion equivalente a los
          participantes registrados.
        </p>
        <p>
          En caso de reprogramacion, el participante conserva sus numeros confirmados. Si una rifa se cancelara
          definitivamente, se comunicaran las opciones disponibles conforme a la politica de reembolsos y al metodo de
          pago utilizado.
        </p>

        <h2>Seleccion del ganador</h2>
        <p>
          Salvo que la rifa activa indique algo distinto, el ganador se determina con los ultimos 2 numeros del Premio
          Mayor de la Loteria Nacional correspondiente al sorteo indicado. El resultado se puede verificar en la fuente
          oficial o liga publicada para esa rifa.
        </p>
        <p>
          Si el numero ganador no estuviera vendido o confirmado, se seguira la regla especifica publicada para esa rifa
          o se comunicara el procedimiento aplicable antes de cerrar el resultado.
        </p>

        <h2>Entrega del premio</h2>
        <p>
          La entrega se coordina directamente con el ganador. Puede realizarse de forma presencial o por envio asegurado,
          segun ubicacion, disponibilidad y acuerdo con el ganador.
        </p>
        <p>
          El ganador debera confirmar identidad y datos de contacto para coordinar entrega, seguro, evidencia de recepcion
          y cualquier requisito operativo aplicable.
        </p>

        <h2>Restricciones</h2>
        <p>
          La participacion esta dirigida a personas mayores de edad con capacidad para completar el pago y recibir el premio
          dentro de Mexico, salvo que Mazal Time confirme por escrito una excepcion operativa.
        </p>
      </article>
    </main>
  );
}
