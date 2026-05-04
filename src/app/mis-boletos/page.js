import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import styles from './mis-boletos.module.css';
import UserMenu from '@/components/UserMenu';

export const revalidate = 0;

export default async function MisBoletosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Get all tickets for this user
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { raffle: true },
    orderBy: { createdAt: 'desc' }
  });

  // Group tickets by raffle
  const rafflesMap = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.raffleId]) {
      acc[ticket.raffleId] = {
        raffle: ticket.raffle,
        tickets: []
      };
    }
    acc[ticket.raffleId].tickets.push(ticket);
    return acc;
  }, {});

  const raffles = Object.values(rafflesMap);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>MAZAL TIME</Link>
        <UserMenu />
      </header>

      <h1 className={styles.pageTitle}>Mis Boletos</h1>

      {raffles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no has comprado boletos para ninguna rifa.</p>
          <Link href="/" className={styles.btnPrimary}>Ver Rifas Activas</Link>
        </div>
      ) : (
        <div className={styles.rafflesList}>
          {raffles.map(({ raffle, tickets }) => (
            <div key={raffle.id} className={`${styles.raffleCard} glass`}>
              <div className={styles.raffleHeader}>
                <h2>{raffle.title}</h2>
                <p className={styles.watchName}>{raffle.watchName}</p>
                <p className={styles.drawDate}>
                  Sorteo: {new Date(raffle.drawDate).toLocaleDateString('es-MX')} - {raffle.zodiacSign}
                </p>
              </div>
              <div className={styles.ticketsSection}>
                <h3>Tus Números ({tickets.length}):</h3>
                <div className={styles.numbersGrid}>
                  {tickets.map(t => (
                    <div key={t.id} className={`${styles.numberBadge} ${styles[t.status.toLowerCase()]}`}>
                      {t.number.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
