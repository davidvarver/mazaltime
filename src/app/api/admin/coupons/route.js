import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthorizedAdmin } from '@/lib/adminGuard';
import { normalizeCouponCode } from '@/lib/coupons';

function requireEliahu(admin) {
  return admin?.username === 'eliahu';
}

function parseDiscount(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 90 ? parsed : null;
}

function parseExpiry(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(req) {
  try {
    const { admin, error } = await getAuthorizedAdmin(req);
    if (error) return error;
    if (!requireEliahu(admin)) return NextResponse.json({ error: 'Solo Eliahu puede administrar cupones.' }, { status: 403 });

    const coupons = await prisma.coupon.findMany({
      orderBy: [{ isActive: 'desc' }, { expiresAt: 'desc' }],
      include: { createdByAdmin: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json({ error: 'Error al cargar cupones.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { admin, error } = await getAuthorizedAdmin(req);
    if (error) return error;
    if (!requireEliahu(admin)) return NextResponse.json({ error: 'Solo Eliahu puede administrar cupones.' }, { status: 403 });

    const { code, discountPercent, expiresAt } = await req.json();
    const normalizedCode = normalizeCouponCode(code);
    const parsedDiscount = parseDiscount(discountPercent);
    const parsedExpiry = parseExpiry(expiresAt);

    if (!normalizedCode || normalizedCode.length < 3 || normalizedCode.length > 24) {
      return NextResponse.json({ error: 'El cupón debe tener de 3 a 24 caracteres.' }, { status: 400 });
    }

    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Usa solo letras, números, guion o guion bajo.' }, { status: 400 });
    }

    if (!parsedDiscount) {
      return NextResponse.json({ error: 'El descuento debe ser entre 1% y 90%.' }, { status: 400 });
    }

    if (!parsedExpiry || parsedExpiry.getTime() < Date.now()) {
      return NextResponse.json({ error: 'La expiración debe ser futura.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountPercent: parsedDiscount,
        expiresAt: parsedExpiry,
        createdByAdminId: admin.id,
      },
      include: { createdByAdmin: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupons POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ese cupón ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear cupón.' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { admin, error } = await getAuthorizedAdmin(req);
    if (error) return error;
    if (!requireEliahu(admin)) return NextResponse.json({ error: 'Solo Eliahu puede administrar cupones.' }, { status: 403 });

    const { id, isActive } = await req.json();
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
      include: { createdByAdmin: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupons PATCH error:', error);
    return NextResponse.json({ error: 'Error al actualizar cupón.' }, { status: 500 });
  }
}
