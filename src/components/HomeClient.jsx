'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import HeroInfo from './HeroInfo';
import NumberGrid from './NumberGrid';
import CheckoutModal from './CheckoutModal';
import UserMenu from './UserMenu';
import PastRaffles from './PastRaffles';
import styles from './HomeClient.module.css';

export default function HomeClient({ raffle, initialTickets, pastRaffles = [] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState(initialTickets);

  const handleSelectNumber = (numbers) => {
    setSelectedNumbers(numbers);
  };

  const handleOpenCheckout = () => {
    if (selectedNumbers.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleSubmitCheckout = async (formData, numbers) => {
    try {
      if (!session) {
        // Register the user first
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Error al registrar tu cuenta. Si ya tienes una, inicia sesión primero.');

        // Sign them in automatically
        const signInRes = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (signInRes?.error) {
          throw new Error('Error al iniciar sesión automáticamente');
        }
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: raffle.id,
          numbers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout (or mock success URL)
      window.location.href = data.url;

    } catch (error) {
      alert(error.message || 'Hubo un error al procesar el pago');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>MAZAL TIME</div>
        <UserMenu />
      </header>

      {raffle ? (
        <>
          <HeroInfo raffle={raffle} />
          
          <NumberGrid 
            tickets={tickets} 
            onSelectNumber={handleSelectNumber} 
          />

          {selectedNumbers.length > 0 && (
            <div className={styles.floatingAction}>
              <button className={styles.checkoutBtn} onClick={handleOpenCheckout}>
                Comprar {selectedNumbers.length} {selectedNumbers.length === 1 ? 'número' : 'números'}
              </button>
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
          <p>⏳ No hay una rifa activa en este momento.</p>
          <p className={styles.noRaffleSubtext}>Síguenos en redes para enterarte cuando lancemos la próxima.</p>
        </div>
      )}

      {pastRaffles.length > 0 && (
        <PastRaffles pastRaffles={pastRaffles} />
      )}
    </div>
  );
}
