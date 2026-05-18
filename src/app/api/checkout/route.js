import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Checkout manual deshabilitado. Usa Conekta Checkout.' },
    { status: 410 }
  );
}
