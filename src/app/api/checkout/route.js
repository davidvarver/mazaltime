import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Checkout manual deshabilitado. Usa Stripe Checkout.' },
    { status: 410 }
  );
}
