import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import styles from './mis-boletos.module.css';
import UserMenu from '@/components/UserMenu';
import { formatDateOnly } from '@/lib/dateOnly';

export const revalidate = 0;

export default async function MisBoletosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { raffle: true },
    orderBy: { createdAt: 'desc' }
  });

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
        <Link href="/" className={styles.logo} aria-label="Volver a Mazal Time">
          <Image
            src="/mazal-time-logo.png"
            alt="Mazal Time"
            width={360}
            height={112}
            priority
          />
        </Link>
        <UserMenu />
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <span>Participaciones</span>
          <h1>Mis boletos</h1>
          <p>Revisa tus números confirmados y el sorteo al que pertenecen.</p>
        </section>

        {raffles.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aún no has comprado boletos para ninguna rifa.</p>
            <Link href="/" className={styles.btnPrimary}>Ver rifa activa</Link>
          </div>
        ) : (
          <div className={styles.rafflesList}>
            {raffles.map(({ raffle, tickets }) => (
              <article key={raffle.id} className={styles.raffleCard}>
                <div className={styles.raffleHeader}>
                  <div>
                    <span className={styles.raffleLabel}>{raffle.title}</span>
                    <h2>{raffle.watchName}</h2>
                  </div>
                  <p className={styles.drawDate}>
                    Sorteo: {formatDateOnly(raffle.drawDate)} · {raffle.zodiacSign}
                  </p>
                </div>

                <div className={styles.ticketsSection}>
                  <h3>Tus números ({tickets.length})</h3>
                  <div className={styles.numbersGrid}>
                    {tickets.map(t => (
                      <div key={t.id} className={`${styles.numberBadge} ${styles[t.status.toLowerCase()]}`}>
                        {t.number.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
