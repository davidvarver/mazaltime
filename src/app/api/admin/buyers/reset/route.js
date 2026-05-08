import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthorizedAdmin } from '@/lib/adminGuard';

export async function DELETE(req) {
  try {
    const { admin, error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    if (admin.username !== 'eliahu') {
      return NextResponse.json({ error: 'Solo Eliahu puede borrar compradores de prueba.' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTickets = await tx.ticket.updateMany({
        where: {
          OR: [
            { status: { in: ['SOLD', 'RESERVED'] } },
            { userId: { not: null } },
            { buyerName: { not: null } },
            { buyerPhone: { not: null } },
            { stripeSessionId: { not: null } },
          ],
        },
        data: {
          status: 'AVAILABLE',
          userId: null,
          buyerName: null,
          buyerPhone: null,
          notes: null,
          pricePaid: null,
          stripeSessionId: null,
          reservedAt: null,
          adminId: null,
        },
      });

      const deletedUsers = await tx.user.deleteMany({});

      return {
        ticketsCleared: updatedTickets.count,
        usersDeleted: deletedUsers.count,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Buyer reset error:', error);
    return NextResponse.json({ error: 'Error al borrar compradores de prueba.' }, { status: 500 });
  }
}
