import { prisma } from '@/lib/prisma';

export const RESERVATION_MINUTES = 30;

export function getReservationCutoff(now = new Date()) {
  return new Date(now.getTime() - RESERVATION_MINUTES * 60 * 1000);
}

export async function releaseExpiredReservations(raffleId) {
  return prisma.ticket.updateMany({
    where: {
      ...(raffleId ? { raffleId } : {}),
      OR: [
        { status: 'RESERVED', reservedAt: { lt: getReservationCutoff() } },
        { status: 'RESERVED', userId: null },
      ],
    },
    data: {
      status: 'AVAILABLE',
      userId: null,
      buyerName: null,
      buyerPhone: null,
      pricePaid: null,
      stripeSessionId: null,
      reservedAt: null,
    },
  });
}

export function getReservationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);
}
