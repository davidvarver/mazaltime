import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

export async function getAuthorizedAdmin(req, { allowPasswordChange = false } = {}) {
  const session = getAdminSessionFromRequest(req);

  if (!session) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, username: true, mustChangePassword: true },
  });

  if (!admin) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  if (admin.mustChangePassword && !allowPasswordChange) {
    return {
      error: NextResponse.json(
        { error: 'Debes cambiar tu contrasena antes de continuar.', forcePasswordChange: true },
        { status: 403 }
      ),
    };
  }

  return { admin };
}
