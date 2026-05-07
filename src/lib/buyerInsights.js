export function buildBuyerInsights(soldTickets, activeRaffleId) {
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
        notes: [],
        lastPurchaseAt: ticket.updatedAt,
      });
    }

    const buyer = buyers.get(key);
    const paid = ticket.pricePaid || ticket.raffle?.price1 || 0;

    buyer.totalTickets += 1;
    buyer.totalSpent += paid;
    buyer.raffles.add(ticket.raffleId);

    if (ticket.notes) {
      const numberLabel = String(ticket.number).padStart(2, '0');
      buyer.notes.push(`#${numberLabel}: ${ticket.notes}`);
    }

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
        customerStatusLabel: isNew ? 'Nuevo' : isRecurring ? 'Recurrente' : isInactive ? 'Inactivo' : 'Historico',
        notesText: buyer.notes.join(' | '),
        lastPurchaseAt: buyer.lastPurchaseAt?.toISOString?.() || null,
        raffles: undefined,
        notes: undefined,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}
