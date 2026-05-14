import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rate = checkRateLimit(`email-status:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ exists: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    return NextResponse.json({ exists: Boolean(user) });
  } catch (error) {
    console.error('Email status error:', error);
    return NextResponse.json({ error: 'No se pudo revisar el correo.' }, { status: 500 });
  }
}
