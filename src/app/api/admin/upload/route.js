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
      return NextResponse.json({ error: 'No se recibio ningun archivo' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG, WebP, MP4, WebM o MOV.' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? 'El video no puede pesar mas de 30MB.' : 'La imagen no puede pesar mas de 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const folder = isVideo ? 'watch-videos' : 'watches';
    const filename = `${folder}/watch_${Date.now()}.${ext}`;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured.');
      return NextResponse.json({ error: 'Storage de archivos no configurado' }, { status: 500 });
    }

    const blob = await put(filename, file, {
      access: 'private',
      contentType: file.type,
    });

    const fileUrl = new URL('/api/blob', req.nextUrl.origin);
    fileUrl.searchParams.set('pathname', blob.pathname);

    return NextResponse.json({ url: fileUrl.toString(), type: isVideo ? 'video' : 'image' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Error al subir el archivo',
    }, { status: 500 });
  }
}
