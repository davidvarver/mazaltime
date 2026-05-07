import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { buildBuyerInsights } from '@/lib/buyerInsights';

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export async function GET(req) {
  try {
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const activeRaffle = await prisma.raffle.findFirst({
      where: { isActive: true },
      select: { id: true, watchName: true },
    });

    const soldTickets = await prisma.ticket.findMany({
      where: { status: 'SOLD' },
      include: {
        user: true,
        raffle: {
          select: { id: true, title: true, watchName: true, isActive: true, drawDate: true, price1: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const buyers = buildBuyerInsights(soldTickets, activeRaffle?.id);
    const rows = [
      ['Cliente', 'Etiqueta', 'Telefono', 'Correo', 'Rifas participadas', 'Boletos total', 'Gastado total MXN', 'Compro esta rifa', 'Boletos esta rifa', 'Gastado esta rifa MXN', 'Ultima compra', 'Rifa activa', 'Notas'],
      ...buyers.map(buyer => [
        buyer.name,
        buyer.customerStatusLabel,
        buyer.phone,
        buyer.email,
        buyer.rafflesParticipated,
        buyer.totalTickets,
        buyer.totalSpent,
        buyer.boughtCurrent ? 'Si' : 'No',
        buyer.currentTickets,
        buyer.currentSpent,
        formatDate(buyer.lastPurchaseAt),
        activeRaffle?.watchName || '',
        buyer.notesText || '',
      ]),
    ];

    const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\n')}`;
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-mazaltime-${today}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Buyer export error:', error);
    return NextResponse.json({ error: 'Error al exportar compradores' }, { status: 500 });
  }
}
