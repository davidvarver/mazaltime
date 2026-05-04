import { prisma } from '@/lib/prisma';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const raffle = await prisma.raffle.findFirst({
    where: { isActive: true },
    include: {
      tickets: {
        orderBy: { number: 'asc' },
        include: { admin: true, user: true }
      }
    }
  });

  const admins = await prisma.admin.findMany();

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
