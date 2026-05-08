import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthorizedAdmin } from '@/lib/adminGuard';

function requireEliahu(admin) {
  return admin?.username === 'eliahu';
}

export async function POST(req) {
  try {
    const { admin, error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    if (!requireEliahu(admin)) {
      return NextResponse.json({ error: 'Solo Eliahu puede administrar accesos.' }, { status: 403 });
    }

    const { name, username, password } = await req.json();
    const normalizedName = String(name || '').trim();
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!normalizedName || !normalizedUsername || rawPassword.length < 6) {
      return NextResponse.json({ error: 'Nombre, usuario y contrasena temporal de minimo 6 caracteres son requeridos.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const createdAdmin = await prisma.admin.create({
      data: {
        name: normalizedName,
        username: normalizedUsername,
        password: passwordHash,
        mustChangePassword: true,
      },
      select: { id: true, name: true, username: true, mustChangePassword: true },
    });

    return NextResponse.json({ success: true, admin: createdAdmin });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ese usuario ya existe.' }, { status: 409 });
    }

    console.error('Admin create error:', error);
    return NextResponse.json({ error: 'Error al crear admin.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { admin, error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    if (!requireEliahu(admin)) {
      return NextResponse.json({ error: 'Solo Eliahu puede administrar accesos.' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de admin requerido.' }, { status: 400 });
    }

    const adminToDelete = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, username: true },
    });

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin no encontrado.' }, { status: 404 });
    }

    if (adminToDelete.username === 'eliahu' || adminToDelete.id === admin.id) {
      return NextResponse.json({ error: 'No se puede eliminar al admin principal.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { adminId: id },
        data: { adminId: null },
      });

      await tx.admin.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    return NextResponse.json({ error: 'Error al eliminar admin.' }, { status: 500 });
  }
}
