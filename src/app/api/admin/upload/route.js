import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

export async function POST(req) {
  try {
    if (!getAdminSessionFromRequest(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede pesar más de 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const filename = `watches/watch_${Date.now()}.${ext}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured.');
      return NextResponse.json({ error: 'Storage de imágenes no configurado' }, { status: 500 });
    }

    let blob;

    try {
      blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      });
    } catch (blobError) {
      const message = blobError.message || '';

      throw blobError;
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Error al subir la imagen',
    }, { status: 500 });
  }
}
