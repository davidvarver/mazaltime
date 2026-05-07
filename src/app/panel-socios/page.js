import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ensureDefaultData } from '@/lib/bootstrap';
import { getAdminSessionFromCookies } from '@/lib/adminAuth';
import { buildBuyerInsights } from '@/lib/buyerInsights';
import AdminClient from '../admin/AdminClient';

export const revalidate = 0;

async function getPanelData(adminSession) {
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
    const loggedAdmin = adminSession?.id
      ? await prisma.admin.findUnique({
        where: { id: adminSession.id },
        select: { id: true, name: true, username: true, mustChangePassword: true },
      })
      : null;
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

    return { raffle, admins, pastRaffles, loggedAdmin, buyerInsights: buildBuyerInsights(soldTickets, raffle?.id) };
  } catch (error) {
    console.error('Admin panel database error:', error);

    return { raffle: null, admins: [], pastRaffles: [], loggedAdmin: null, buyerInsights: [] };
  }
}

export default async function SociosPanelPage() {
  const cookieStore = await cookies();
  const adminSession = getAdminSessionFromCookies(cookieStore);

  if (!adminSession) {
    redirect('/panel-socios/login');
  }

  const { raffle, admins, pastRaffles, loggedAdmin, buyerInsights } = await getPanelData(adminSession);

  if (!loggedAdmin) {
    redirect('/panel-socios/login');
  }

  if (loggedAdmin.mustChangePassword) {
    redirect('/panel-socios/cambiar-contrasena');
  }

  return (
    <div>
      <AdminClient
        raffle={raffle || null}
        tickets={raffle ? raffle.tickets : []}
        admins={admins}
        pastRaffles={pastRaffles}
        loggedAdminId={adminSession.id}
        loggedAdminName={loggedAdmin.name}
        buyerInsights={buyerInsights}
      />
    </div>
  );
}
