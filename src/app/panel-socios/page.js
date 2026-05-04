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

    return { raffle, admins };
  } catch (error) {
    console.error('Admin panel database error:', error);

    return { raffle: null, admins: [] };
  }
}

export default async function SociosPanelPage() {
  const cookieStore = await cookies();
  const adminSession = getAdminSessionFromCookies(cookieStore);

  if (!adminSession) {
    redirect('/panel-socios/login');
  }

  const { raffle, admins } = await getPanelData();

  return (
    <div className="main-container" style={{ padding: '2rem' }}>
      <AdminClient
        raffle={raffle || null}
        tickets={raffle ? raffle.tickets : []}
        admins={admins}
      />
    </div>
  );
}
