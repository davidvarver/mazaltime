import Link from 'next/link';
import styles from '../legal.module.css';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Aviso de privacidad',
  description: 'Aviso de privacidad de Mazal Time para participantes de rifas de relojes de lujo en Mexico.',
  path: '/privacidad',
  keywords: ['privacidad Mazal Time', 'datos personales rifas Mexico'],
});

export default function PrivacidadPage() {
  return (
    <main className={styles.legalPage}>
      <article className={styles.legalCard}>
        <Link href="/" className={styles.backLink}>Volver a Mazal Time</Link>
        <span className={styles.eyebrow}>Privacidad</span>
        <h1>Aviso de privacidad</h1>
        <p>
          Mazal Time usa tus datos para operar rifas, confirmar participaciones, dar seguimiento a pagos, comunicar
          resultados y coordinar la entrega de premios cuando corresponda.
        </p>

        <h2>Datos que podemos solicitar</h2>
        <ul>
          <li>Nombre completo.</li>
          <li>Correo electronico.</li>
          <li>Telefono o WhatsApp.</li>
          <li>Numeros seleccionados, rifa, estado de pago y datos de participacion.</li>
          <li>Datos necesarios para entrega si resultas ganador.</li>
        </ul>

        <h2>Uso de la informacion</h2>
        <p>
          No vendemos tu informacion. La usamos para operar el servicio, validar boletos, enviar confirmaciones, resolver
          soporte y cumplir obligaciones administrativas relacionadas con la participacion.
        </p>

        <h2>Procesadores externos</h2>
        <p>
          Podemos usar proveedores como Stripe para pagos, Vercel para infraestructura y herramientas de comunicacion para
          atencion por WhatsApp o correo. Cada proveedor procesa la informacion necesaria para prestar su servicio.
        </p>

        <h2>Derechos y contacto</h2>
        <p>
          Si deseas consultar, corregir o solicitar la eliminacion de tus datos de contacto, escribenos por WhatsApp desde
          el enlace oficial del sitio. Conservaremos registros operativos cuando sean necesarios para historial de rifas o
          aclaraciones.
        </p>
      </article>
    </main>
  );
}
