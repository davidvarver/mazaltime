import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthorizedAdmin } from '@/lib/adminGuard';
import { verifyAdminPassword } from '@/lib/adminAuth';

export async function PATCH(req) {
  try {
    const { admin, error } = await getAuthorizedAdmin(req, { allowPasswordChange: true });
    if (error) return error;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseña actual y nueva requeridas' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'La nueva contraseña debe ser diferente' }, { status: 400 });
    }

    const fullAdmin = await prisma.admin.findUnique({ where: { id: admin.id } });
    const isValid = await verifyAdminPassword(fullAdmin, currentPassword);

    if (!isValid) {
      return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin password update error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
