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
              <small>Sorteos premium con garantia</small>
            </span>
          </a>

          <nav className={styles.nav} aria-label="Navegacion principal">
            <a href="#inicio">Inicio</a>
            <a href="#rifa-activa">Sorteo activo</a>
            <a href="#numeros">Numeros</a>
            <a href="#ganadores">Ganadores</a>
          </nav>

          <UserMenu />
        </div>
      </header>

      <main id="inicio">
        <section className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <span className={styles.badge}>✨ Edición activa 2026</span>
            <h1>Gana un reloj de lujo con una experiencia clara y segura.</h1>
            <p>
              🎟️ Elige tus números, participa en el sorteo oficial y revisa el avance en tiempo real.
              Mazal Time combina lujo, transparencia y atención personalizada.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryBtn} onClick={scrollToNumbers}>
                🎫 Elegir mi número
              </button>
              <a href="https://wa.me/525530182177" className={styles.secondaryBtn} target="_blank" rel="noreferrer">
                💬 Contactar por WhatsApp
              </a>
            </div>
            <div className={styles.heroStats}>
              <div><strong>{availableTickets}</strong><span>Disponibles</span></div>
              <div><strong>{soldTickets}</strong><span>Vendidos</span></div>
              <div><strong>{totalTickets}</strong><span>Boletos</span></div>
            </div>
          </div>

          <div className={styles.heroImageCard}>
            <div className={styles.previewImage}>
              <Image
                src={raffle?.imageUrl || '/rolex_demo.png'}
                alt={raffle?.watchName || 'Reloj Mazal Time'}
                fill
                sizes="(max-width: 780px) 100vw, 520px"
                style={{ objectFit: 'cover' }}
                priority
                unoptimized={!!raffle?.imageUrl}
              />
              <div className={styles.imageGlow} />
            </div>
            <div className={styles.previewBadge}>🔥 Sorteo activo</div>
            <div className={styles.previewInfo}>
              <span>Premio destacado</span>
              <strong>{raffle?.watchName || 'Reloj de lujo'}</strong>
              <small>Desde ${raffle?.price1?.toLocaleString() || '0'} MXN por número</small>
            </div>
            <div className={styles.previewMiniStats}>
              <div><strong>{availableTickets}</strong><span>Libres</span></div>
              <div><strong>{countdown.days}</strong><span>Días</span></div>
            </div>
          </div>
        </section>

        <section className={styles.countdownSection} aria-label="Cuenta regresiva del sorteo">
          <span>🔥 Próximo sorteo en vivo</span>
          <div className={styles.countdownBox}>
            <div><strong>{countdown.days}</strong><small>Días</small></div>
            <div><strong>{countdown.hours}</strong><small>Horas</small></div>
            <div><strong>{countdown.minutes}</strong><small>Min</small></div>
          </div>
        </section>

        <section className={styles.trustBand}>
          <div><strong>🎫 +100 boletos</strong><span>por edición</span></div>
          <div><strong>🛡️ Sorteo transparente</strong><span>con resultado verificable</span></div>
          <div><strong>💬 Atención directa</strong><span>por WhatsApp</span></div>
        </section>

        {raffle ? (
          <>
            <section id="rifa-activa" className={styles.sectionIntro}>
              <span>⌚ Sorteo activo</span>
              <h2>Selecciona tu número favorito y participa</h2>
            </section>

            <HeroInfo raffle={raffle} tickets={tickets} />

            <section id="numeros">
              <NumberGrid
                tickets={tickets}
                onSelectNumber={handleSelectNumber}
              />
            </section>

            {selectedNumbers.length > 0 && (
              <div className={styles.floatingAction}>
                <div className={styles.checkoutBar}>
                  <div>
                    <span>🎟️ Tus números</span>
                    <strong>{selectedNumbers.map(number => number.toString().padStart(2, '0')).join(', ')}</strong>
                  </div>
                  <div>
                    <span>Total estimado</span>
                    <strong>${selectedTotal.toLocaleString()} MXN</strong>
                  </div>
                  <button className={styles.checkoutBtn} onClick={handleOpenCheckout}>
                    🛒 Comprar ahora
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
            <p className={styles.noRaffleSubtext}>Siguenos en redes para enterarte cuando lancemos la proxima.</p>
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
          <p>Sorteos premium de relojes de lujo en Mexico.</p>
        </div>
        <div>
          <span>Contacto</span>
          <a href="https://wa.me/525530182177" target="_blank" rel="noreferrer">WhatsApp directo</a>
        </div>
        <div>
          <span>Legal</span>
          <p>Bases del sorteo, privacidad y terminos disponibles bajo solicitud.</p>
        </div>
      </footer>
    </div>
  );
}
