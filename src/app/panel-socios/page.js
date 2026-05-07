import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ensureDefaultData } from '@/lib/bootstrap';
import { getAdminSessionFromCookies } from '@/lib/adminAuth';
import AdminClient from '../admin/AdminClient';

export const revalidate = 0;

async function getPanelData() {
  try {
    await ensureDefaultData(prisma);

    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
      include: {
        tickets: {
          orderBy: { number: 'asc' },
          include: { admin: true, user: true },
        },
      },
    });

    const admins = await prisma.admin.findMany();
    const pastRaffles = await prisma.raffle.findMany({
      where: { isActive: false },
      orderBy: { drawDate: 'desc' },
    });

    const soldTickets = await prisma.ticket.findMany({
      where: { status: 'SOLD' },
      include: {
        user: true,
        raffle: {
          select: { id: true, title: true, watchName: true, isActive: true, drawDate: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { raffle, admins, pastRaffles, buyerInsights: buildBuyerInsights(soldTickets, raffle?.id) };
  } catch (error) {
    console.error('Admin panel database error:', error);

    return { raffle: null, admins: [], pastRaffles: [], buyerInsights: [] };
  }
}

function buildBuyerInsights(soldTickets, activeRaffleId) {
  const buyers = new Map();

  for (const ticket of soldTickets) {
    const email = ticket.user?.email || '';
    const phone = ticket.user?.phone || ticket.buyerPhone || '';
    const name = ticket.user?.name || ticket.buyerName || 'Cliente sin nombre';
    const key = ticket.userId ? `user:${ticket.userId}` : `manual:${phone || name.toLowerCase()}`;

    if (!buyers.has(key)) {
      buyers.set(key, {
        key,
        name,
        email,
        phone,
        totalTickets: 0,
        totalSpent: 0,
        currentTickets: 0,
        currentSpent: 0,
        raffles: new Set(),
        lastPurchaseAt: ticket.updatedAt,
      });
    }

    const buyer = buyers.get(key);
    const paid = ticket.pricePaid || ticket.raffle?.price1 || 0;

    buyer.totalTickets += 1;
    buyer.totalSpent += paid;
    buyer.raffles.add(ticket.raffleId);

    if (ticket.raffleId === activeRaffleId) {
      buyer.currentTickets += 1;
      buyer.currentSpent += paid;
    }

    if (ticket.updatedAt > buyer.lastPurchaseAt) {
      buyer.lastPurchaseAt = ticket.updatedAt;
    }
  }

  return [...buyers.values()]
    .map((buyer) => {
      const rafflesParticipated = buyer.raffles.size;
      const boughtCurrent = buyer.currentTickets > 0;
      const isNew = boughtCurrent && rafflesParticipated === 1;
      const isRecurring = boughtCurrent && rafflesParticipated > 1;
      const isInactive = !boughtCurrent && buyer.totalTickets > 0;

      return {
        ...buyer,
        rafflesParticipated,
        boughtCurrent,
        customerStatus: isNew ? 'NEW' : isRecurring ? 'RECURRING' : isInactive ? 'INACTIVE' : 'HISTORICAL',
        customerStatusLabel: isNew ? 'Nuevo' : isRecurring ? 'Recurrente' : isInactive ? 'Inactivo' : 'Histórico',
        lastPurchaseAt: buyer.lastPurchaseAt?.toISOString?.() || null,
        raffles: undefined,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export default async function SociosPanelPage() {
  const cookieStore = await cookies();
  const adminSession = getAdminSessionFromCookies(cookieStore);

  if (!adminSession) {
    redirect('/panel-socios/login');
  }

  const { raffle, admins, pastRaffles, buyerInsights } = await getPanelData();

  return (
    <div>
      <AdminClient
        raffle={raffle || null}
        tickets={raffle ? raffle.tickets : []}
        admins={admins}
        pastRaffles={pastRaffles}
        loggedAdminId={adminSession.id}
        buyerInsights={buyerInsights}
      />
    </div>
  );
}
