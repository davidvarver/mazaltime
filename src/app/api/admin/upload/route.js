import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAuthorizedAdmin } from '@/lib/adminGuard';

export async function POST(req) {
  try {
    const { error: authError } = await getAuthorizedAdmin(req);
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede pesar más de 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const filename = `watches/watch_${Date.now()}.${ext}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured.');
      return NextResponse.json({ error: 'Storage de imágenes no configurado' }, { status: 500 });
    }

    const blob = await put(filename, file, {
      access: 'private',
      contentType: file.type,
    });

    const imageUrl = new URL('/api/blob', req.nextUrl.origin);
    imageUrl.searchParams.set('pathname', blob.pathname);

    return NextResponse.json({ url: imageUrl.toString() });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Error al subir la imagen',
    }, { status: 500 });
  }
}
