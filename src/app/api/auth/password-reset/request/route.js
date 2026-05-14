import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createResetToken, getResetExpiry } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://mazaltime.com.mx';
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Ingresa tu correo.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Respuesta neutral para no revelar si un correo existe o no.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const { token, tokenHash } = createResetToken();
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: getResetExpiry(),
      },
    });

    const resetUrl = `${getAppUrl()}/restablecer-contrasena?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Password reset request error: ${error?.message || error}`);
    return NextResponse.json({
      error: 'No se pudo enviar la recuperación.',
      detail: error?.message || 'Error desconocido',
    }, { status: 500 });
  }
}
