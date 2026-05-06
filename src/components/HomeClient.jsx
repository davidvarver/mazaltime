'use client';
import { useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import HeroInfo from './HeroInfo';
import NumberGrid from './NumberGrid';
import CheckoutModal from './CheckoutModal';
import UserMenu from './UserMenu';
import PastRaffles from './PastRaffles';
import styles from './HomeClient.module.css';

const WHATSAPP_URL = 'https://wa.me/525523138175';

function getCountdownParts(drawDate) {
  if (!drawDate) return { days: '00', hours: '00', minutes: '00' };

  const target = new Date(drawDate).getTime();
  const diff = Math.max(target - Date.now(), 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
  };
}

export default function HomeClient({ raffle, initialTickets, pastRaffles = [] }) {
  const { data: session } = useSession();
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState(initialTickets);

  const countdown = useMemo(() => getCountdownParts(raffle?.drawDate), [raffle?.drawDate]);
  const totalTickets = tickets.length || 100;
  const availableTickets = tickets.filter(ticket => ticket.status === 'AVAILABLE').length;
  const soldTickets = Math.max(totalTickets - availableTickets, 0);
  const selectedPrice = raffle && selectedNumbers.length >= 2 ? raffle.price2 : raffle?.price1 || 0;
  const selectedTotal = selectedNumbers.length * selectedPrice;

  const handleSelectNumber = (numbers) => {
    setSelectedNumbers(numbers);
  };

  const handleOpenCheckout = () => {
    if (selectedNumbers.length > 0) {
      setIsModalOpen(true);
    }
  };

  const scrollToNumbers = () => {
    document.getElementById('numeros')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmitCheckout = async (formData, numbers) => {
    try {
      if (!session) {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Error al registrar tu cuenta. Si ya tienes una, inicia sesion primero.');

        const signInRes = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInRes?.error) {
          throw new Error('Error al iniciar sesion automaticamente');
        }
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: raffle.id,
          numbers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.url;
    } catch (error) {
      alert(error.message || 'Hubo un error al procesar el pago');
    }
  };

  return (
    <div className={styles.pageShell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#inicio" className={styles.brand} aria-label="Mazal Time inicio">
            <span className={styles.brandIcon}>MT</span>
            <span>
              <Image
                src="/mazal-time-logo.png"
                alt="Mazal Time"
                width={260}
                height={80}
                priority
              />
              <small>Sorteos premium con garant&iacute;a</small>
            </span>
          </a>

          <nav className={styles.nav} aria-label="Navegacion principal">
            <a href="#inicio">Inicio</a>
            <a href="#rifa-activa">Sorteo activo</a>
            <a href="#numeros">N&uacute;meros</a>
            <a href="#ganadores">Ganadores</a>
          </nav>

          <UserMenu />
        </div>
      </header>

      <main id="inicio">
        <section className={styles.compactIntro}>
          <div>
            <span>{'\u2728'} Edici&oacute;n activa 2026</span>
            <h1>{raffle?.title || 'Mazal Time'}</h1>
            <p>{raffle?.watchName || 'Sorteo premium de reloj de lujo'}</p>
          </div>
          <div className={styles.compactActions}>
            <button type="button" className={styles.primaryBtn} onClick={scrollToNumbers}>
              {'\u{1F3AB}'} Elegir n&uacute;mero
            </button>
            <a href={WHATSAPP_URL} className={styles.secondaryBtn} target="_blank" rel="noreferrer">
              {'\u{1F4AC}'} WhatsApp
            </a>
          </div>
        </section>

        <section className={styles.countdownSection} aria-label="Cuenta regresiva del sorteo">
          <span>{'\u{1F525}'} Pr&oacute;ximo sorteo en vivo</span>
          <div className={styles.countdownBox}>
            <div><strong>{countdown.days}</strong><small>D&iacute;as</small></div>
            <div><strong>{countdown.hours}</strong><small>Horas</small></div>
            <div><strong>{countdown.minutes}</strong><small>Min</small></div>
          </div>
        </section>

        <section className={styles.trustBand}>
          <div><strong>{'\u{1F3AB}'} +100 boletos</strong><span>por edici&oacute;n</span></div>
          <div><strong>{'\u{1F6E1}\uFE0F'} Sorteo transparente</strong><span>con resultado verificable</span></div>
          <div><strong>{'\u{1F4AC}'} Atenci&oacute;n directa</strong><span>por WhatsApp</span></div>
        </section>

        <section className={styles.infoAccordion}>
          <details>
            <summary>{'\u{1F91D}'} &iquest;C&oacute;mo funciona?</summary>
            <p>Elige uno o varios n&uacute;meros disponibles, registra tus datos y finaliza tu participaci&oacute;n. Te confirmaremos tus boletos y quedar&aacute;n apartados para el sorteo.</p>
          </details>

          <details>
            <summary>{'\u{1F64C}'} &iquest;Cu&aacute;ndo ser&aacute; el sorteo?</summary>
            <p>La fecha publicada en la rifa es la referencia principal. Si el boletaje no llega al m&iacute;nimo requerido, te avisaremos cualquier ajuste con anticipaci&oacute;n.</p>
          </details>

          <details>
            <summary>{'\u{1F3C5}'} &iquest;C&oacute;mo se decidir&aacute; al ganador?</summary>
            <p>El ganador se determina con el n&uacute;mero correspondiente al sorteo indicado, usando un resultado verificable para que todos puedan revisar la transparencia.</p>
          </details>

          <details>
            <summary>{'\u231A'} &iquest;C&oacute;mo entregar&aacute;s el reloj?</summary>
            <p>Coordinamos la entrega directamente con el ganador. Puede ser entrega presencial o env&iacute;o asegurado, seg&uacute;n la ubicaci&oacute;n y acuerdo con el participante.</p>
          </details>
        </section>

        {raffle ? (
          <>
            <section id="rifa-activa" className={styles.sectionIntro}>
              <span>{'\u231A'} Sorteo activo</span>
              <h2>Selecciona tu n&uacute;mero favorito y participa</h2>
            </section>

            <HeroInfo raffle={raffle} tickets={tickets} />

            <section id="numeros">
              <NumberGrid
                tickets={tickets}
                onSelectNumber={handleSelectNumber}
              />
            </section>

            <section className={styles.paymentStrip} aria-label="Formas de pago">
              <p>Comprar es f&aacute;cil, r&aacute;pido y seguro.</p>
              <div>
                <span>VISA</span>
                <span>Mastercard</span>
                <span>AMEX</span>
                <span>Transferencia</span>
              </div>
            </section>

            {selectedNumbers.length > 0 && (
              <div className={styles.floatingAction}>
                <div className={styles.checkoutBar}>
                  <div>
                    <span>{'\u{1F39F}\uFE0F'} Tus n&uacute;meros</span>
                    <strong>{selectedNumbers.map(number => number.toString().padStart(2, '0')).join(', ')}</strong>
                  </div>
                  <div>
                    <span>Total estimado</span>
                    <strong>${selectedTotal.toLocaleString()} MXN</strong>
                  </div>
                  <button className={styles.checkoutBtn} onClick={handleOpenCheckout}>
                    {'\u{1F6D2}'} Comprar ahora
                  </button>
                </div>
              </div>
            )}

            {isModalOpen && (
              <CheckoutModal
                selectedNumbers={selectedNumbers}
                raffle={raffle}
                session={session}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitCheckout}
              />
            )}
          </>
        ) : (
          <div className={styles.noRaffle}>
            <p>No hay una rifa activa en este momento.</p>
            <p className={styles.noRaffleSubtext}>S&iacute;guenos en redes para enterarte cuando lancemos la pr&oacute;xima.</p>
          </div>
        )}

        {pastRaffles.length > 0 && (
          <div id="ganadores">
            <PastRaffles pastRaffles={pastRaffles} />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>Mazal Time</strong>
          <p>Sorteos premium de relojes de lujo en M&eacute;xico.</p>
        </div>
        <div>
          <span>Contacto</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp directo</a>
        </div>
        <div>
          <span>Legal</span>
          <p>Bases del sorteo, privacidad y t&eacute;rminos disponibles bajo solicitud.</p>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        className={styles.whatsappFloat}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir WhatsApp"
      >
        {'\u260E'}
      </a>
    </div>
  );
}
