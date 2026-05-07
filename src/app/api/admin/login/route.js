import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaultData } from '@/lib/bootstrap';
import { setAdminCookie, verifyAdminPassword } from '@/lib/adminAuth';
import { checkRateLimit, clearRateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    await ensureDefaultData(prisma);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateKey = `admin-login:${ip}`;
    const rate = checkRateLimit(rateKey);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const { username, password } = await req.json();
    const normalizedUsername = username?.trim().toLowerCase();

    if (!normalizedUsername || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: normalizedUsername },
    });

    const isValid = await verifyAdminPassword(admin, password);

    if (!admin || !isValid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    clearRateLimit(rateKey);

    const response = NextResponse.json({
      success: true,
      mustChangePassword: admin.mustChangePassword,
      admin: { id: admin.id, name: admin.name, username: admin.username },
    });

    setAdminCookie(response, admin);
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
