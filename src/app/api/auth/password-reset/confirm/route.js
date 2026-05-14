import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashResetToken } from '@/lib/passwordReset';

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    const rawPassword = String(password || '');

    if (!token) {
      return NextResponse.json({ error: 'Enlace inválido.' }, { status: 400 });
    }

    if (rawPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener mínimo 8 caracteres.' }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'El enlace venció o ya fue usado.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 500 });
  }
}
