'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import HeroInfo from './HeroInfo';
import NumberGrid from './NumberGrid';
import CheckoutModal from './CheckoutModal';
import UserMenu from './UserMenu';
import PastRaffles from './PastRaffles';
import { getTicketUnitPrice } from '@/lib/pricing';
import { getRaffleWatchTitle } from '@/lib/raffleDisplay';
import { HOME_TEXT, LANGUAGES } from '@/lib/i18n';
import styles from './HomeClient.module.css';

const WHATSAPP_URL = 'https://wa.me/525523138175';

function formatDrawDate(date) {
  if (!date) return 'Fecha por confirmar';

  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeClient({ raffle, initialTickets, pastRaffles = [] }) {
  const { data: session } = useSession();
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState(initialTickets);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [language, setLanguage] = useState('es');
  const text = HOME_TEXT[language] || HOME_TEXT.es;

  const totalTickets = tickets.length || 100;
  const soldTickets = tickets.filter(ticket => ticket.status === 'SOLD').length;
  const selectedPrice = getTicketUnitPrice(raffle, selectedNumbers.length);
  const selectedTotal = selectedNumbers.length * selectedPrice;
  const latestPastRaffle = pastRaffles[0];
  const activeWatchTitle = raffle ? getRaffleWatchTitle(raffle) : '';
  const activeRaffleSeoTitle = raffle
    ? `Rifa de ${activeWatchTitle} en México — ${totalTickets} boletos`
    : 'Rifas de relojes de lujo en México';

  const handleSelectNumber = (numbers) => {
    setSelectedNumbers(numbers);
  };

  const handleOpenCheckout = () => {
    if (selectedNumbers.length > 0) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    const languageTimer = window.setTimeout(() => {
      const savedLanguage = window.localStorage.getItem('mazaltime_lang');
      if (savedLanguage && HOME_TEXT[savedLanguage]) setLanguage(savedLanguage);
    }, 0);

    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(languageTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem('mazaltime_lang', nextLanguage);
  };

  const handleSubmitCheckout = async (formData, numbers, couponCode = '') => {
    try {
      const res = await fetch('/api/conekta/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: raffle.id,
          numbers,
          customer: session ? undefined : formData,
          couponCode,
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
      <header className={`${styles.header} ${isScrolled ? styles.headerCompact : ''}`}>
        <div className={styles.headerInner}>
          <a href="#inicio" className={styles.brand} aria-label="Mazal Time inicio">
            <Image
              src="/mazal-time-logo.png"
              alt="Mazal Time"
              width={420}
              height={130}
              priority
            />
          </a>

          <div className={styles.headerTools}>
            <UserMenu />
            <div className={styles.languagePicker} aria-label="Elegir idioma">
              {Object.entries(LANGUAGES).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={language === value ? styles.languageActive : ''}
                  onClick={() => handleLanguageChange(value)}
                  aria-pressed={language === value}
                >
                  {value.toUpperCase()}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.navBar}>
          <nav className={styles.nav} aria-label="Navegacion principal">
            <a href="#inicio">{text.navHome}</a>
            <a href="#rifa-activa">{text.navActive}</a>
            <a href="#numeros">{text.navNumbers}</a>
            <a href="/ganadores">{text.navWinners}</a>
          </nav>
        </div>
      </header>

      <main id="inicio">
        <section className={styles.trustBand}>
          <div><strong>{totalTickets} {text.tickets}</strong><span>{text.perEdition}</span></div>
          {raffle?.lotteryUrl ? (
            <a href={raffle.lotteryUrl} target="_blank" rel="noreferrer" aria-label="Abrir sorteo oficial de Loter&iacute;a Nacional">
              <strong>{text.transparent}</strong>
              <span>{text.officialResult}</span>
            </a>
          ) : (
            <div><strong>{text.transparent}</strong><span>{text.verifiable}</span></div>
          )}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp de Mazal Time">
            <strong>{text.directSupport}</strong>
            <span>{text.whatsapp}</span>
          </a>
        </section>

        {raffle && (
          <section id="rifa-activa" className={styles.raffleExperience}>
            <div className={styles.sectionIntro}>
              <span>{text.activeRaffle}</span>
              <h1>{activeRaffleSeoTitle}</h1>
              <p>
                {language === 'en'
                  ? `Choose your number and join the ${activeWatchTitle} raffle with secure payment and a verifiable National Lottery result.`
                  : `Elige tu número y participa en la rifa del ${activeWatchTitle} con pago seguro y resultado verificable por Lotería Nacional.`}
              </p>
            </div>

            <HeroInfo raffle={raffle} tickets={tickets} />

            <div className={styles.infoAccordion}>
              <div className={styles.faqGroup}>
                <details open={openFaq === 'como-funciona'}>
                  <summary onClick={event => {
                    event.preventDefault();
                    setOpenFaq(current => current === 'como-funciona' ? null : 'como-funciona');
                  }}>{text.howWorks}</summary>
                  <p>{text.howWorksBody}</p>
                </details>

                <details open={openFaq === 'fecha-sorteo'}>
                  <summary onClick={event => {
                    event.preventDefault();
                    setOpenFaq(current => current === 'fecha-sorteo' ? null : 'fecha-sorteo');
                  }}>{text.whenDraw}</summary>
                  <p>{text.whenDrawBody}</p>
                </details>
              </div>

              <div className={styles.faqGroup}>
                <details open={openFaq === 'ganador'}>
                  <summary onClick={event => {
                    event.preventDefault();
                    setOpenFaq(current => current === 'ganador' ? null : 'ganador');
                  }}>{text.winnerHow}</summary>
                  <p>{text.winnerHowBody}</p>
                </details>

                <details open={openFaq === 'entrega'}>
                  <summary onClick={event => {
                    event.preventDefault();
                    setOpenFaq(current => current === 'entrega' ? null : 'entrega');
                  }}>{text.delivery}</summary>
                  <p>{text.deliveryBody}</p>
                </details>
              </div>
            </div>
          </section>
        )}

        {raffle ? (
          <>
            <section id="numeros">
              <NumberGrid
                tickets={tickets}
                onSelectNumber={handleSelectNumber}
                labels={{
                  ...text,
                  chooseTicket: language === 'en'
                    ? `Available tickets for the ${activeWatchTitle} raffle`
                    : `Boletos disponibles para la rifa ${activeWatchTitle}`,
                }}
              />
            </section>

            <section className={styles.paymentStrip} aria-label="Formas de pago">
              <p>{text.easyPay}</p>
              <div>
                <span className={`${styles.paymentLogo} ${styles.visaLogo}`}>VISA</span>
                <span className={`${styles.paymentLogo} ${styles.mastercardLogo}`}><i />Mastercard</span>
                <span className={`${styles.paymentLogo} ${styles.amexLogo}`}>AMEX</span>
              </div>
              <button
                type="button"
                className={styles.paymentCta}
                onClick={handleOpenCheckout}
                disabled={selectedNumbers.length === 0}
              >
                {selectedNumbers.length > 0 ? text.buyNow : text.chooseToPay}
              </button>
            </section>

            {selectedNumbers.length > 0 && (
              <div className={styles.floatingAction}>
                <div className={styles.checkoutBar}>
                  <div>
                    <span>{text.yourNumbers}</span>
                    <strong>{selectedNumbers.map(number => number.toString().padStart(2, '0')).join(', ')}</strong>
                  </div>
                  <div>
                    <span>{text.estimatedTotal}</span>
                    <strong>${selectedTotal.toLocaleString()} MXN</strong>
                  </div>
                  <button className={styles.checkoutBtn} onClick={handleOpenCheckout}>
                    {text.buyNow}
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
          <section className={styles.noRaffle} aria-label="Pr&oacute;xima rifa">
            <div className={styles.noRaffleHero}>
              <span>Entre sorteos</span>
              <h1>Estamos preparando la pr&oacute;xima rifa.</h1>
              <p>
                Mientras abrimos la siguiente edici&oacute;n, puedes revisar c&oacute;mo funciona Mazal Time
                y ver el sorteo anterior para conocer el formato.
              </p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={styles.noRaffleBtn}>
                Avisarme por WhatsApp
              </a>
            </div>

            <div className={styles.noRaffleGrid}>
              {latestPastRaffle ? (
                <article className={styles.lastRaffleCard}>
                  <span>&Uacute;ltima rifa</span>
                  <h2>{getRaffleWatchTitle(latestPastRaffle)}</h2>
                  {latestPastRaffle.watchDetails && <p>{latestPastRaffle.watchDetails}</p>}
                  <dl>
                    <div>
                      <dt>Sorteo</dt>
                      <dd>{formatDrawDate(latestPastRaffle.drawDate)}</dd>
                    </div>
                    {latestPastRaffle.winningNumber !== null && latestPastRaffle.winningNumber !== undefined && (
                      <div>
                        <dt>N&uacute;mero ganador</dt>
                        <dd>{latestPastRaffle.winningNumber.toString().padStart(2, '0')}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ) : (
                <article className={styles.lastRaffleCard}>
                  <span>Historial</span>
                  <h2>Pronto ver&aacute;s aqu&iacute; nuestras rifas finalizadas.</h2>
                  <p>Cuando cerremos una rifa, quedar&aacute; guardada con fecha, resultado y ganador.</p>
                </article>
              )}

              <article className={styles.howItWorksCard}>
                <span>C&oacute;mo funciona</span>
                <ul>
                  <li>Publicamos la rifa activa con fecha, precio y regla del sorteo.</li>
                  <li>Eliges tus n&uacute;meros disponibles y completas el pago seguro.</li>
                  <li>El ganador se define con los &uacute;ltimos 2 n&uacute;meros del Premio Mayor indicado.</li>
                  <li>Coordinamos la entrega directamente con el ganador.</li>
                </ul>
              </article>
            </div>
          </section>
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
          <div className={styles.legalLinks}>
            <a href="/rifas-rolex">Rifas Rolex</a>
            <a href="/rifas-relojes-lujo">Rifas de relojes de lujo</a>
            <a href="/como-funciona">C&oacute;mo funciona</a>
            <a href="/ganadores">Ganadores anteriores</a>
            <a href="/quienes-somos">Quiénes somos</a>
          </div>
        </div>
        <div>
          <span>Contacto</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp directo</a>
        </div>
        <div>
          <span>Legal</span>
          <div className={styles.legalLinks}>
            <a href="/bases">Bases del sorteo</a>
            <a href="/privacidad">Privacidad</a>
            <a href="/terminos">T&eacute;rminos</a>
            <a href="/politica-de-reembolsos">Reembolsos</a>
            <a href="/legalidad-del-sorteo">Legalidad del sorteo</a>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        className={styles.whatsappFloat}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir WhatsApp"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.02 3.2c-7.05 0-12.78 5.63-12.78 12.56 0 2.37.68 4.67 1.96 6.66L3.12 28.8l6.63-2.02a12.96 12.96 0 0 0 6.27 1.61c7.04 0 12.77-5.63 12.77-12.56S23.06 3.2 16.02 3.2Zm0 22.99c-1.98 0-3.9-.55-5.56-1.58l-.4-.25-3.94 1.2 1.25-3.79-.27-.41a10.12 10.12 0 0 1-1.65-5.6c0-5.72 4.74-10.37 10.57-10.37 5.82 0 10.56 4.65 10.56 10.37 0 5.73-4.74 10.43-10.56 10.43Zm5.79-7.78c-.32-.16-1.88-.91-2.17-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.37.24-.69.08-.32-.16-1.35-.49-2.57-1.55-.95-.84-1.59-1.87-1.78-2.18-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.68-.98-2.3-.26-.6-.52-.52-.71-.53h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.05-1.1 2.56s1.13 2.98 1.29 3.19c.16.21 2.22 3.34 5.38 4.68.75.32 1.34.51 1.8.65.76.24 1.44.21 1.99.13.61-.09 1.88-.76 2.14-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </div>
  );
}
