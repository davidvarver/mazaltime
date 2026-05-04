import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

async function fileToDataUrl(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede pesar más de 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop();
    const filename = `watches/watch_${Date.now()}.${ext}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('BLOB_READ_WRITE_TOKEN is not configured. Using data URL image fallback.');
      return NextResponse.json({ url: await fileToDataUrl(file) });
    }

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Error al subir la imagen',
    }, { status: 500 });
  }
}
