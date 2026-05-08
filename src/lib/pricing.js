export function isPromoEnabled(raffle) {
  return Boolean(raffle?.promoEnabled);
}

export function getPromoMinTickets(raffle) {
  const minTickets = Number(raffle?.promoMinTickets);
  return Number.isInteger(minTickets) && minTickets > 1 ? minTickets : 2;
}

export function getTicketUnitPrice(raffle, ticketCount) {
  if (!raffle) return 0;

  const count = Number(ticketCount) || 0;
  const basePrice = Number(raffle.price1) || 0;
  const promoPrice = Number(raffle.price2) || basePrice;

  if (isPromoEnabled(raffle) && count >= getPromoMinTickets(raffle)) {
    return promoPrice;
  }

  return basePrice;
}

export function getPromoLabel(raffle) {
  return `${getPromoMinTickets(raffle)} o más`;
}
