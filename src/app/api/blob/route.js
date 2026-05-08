import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pathname = searchParams.get('pathname');

    if (!pathname || pathname.includes('..') || !pathname.startsWith('watches/')) {
      return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
    }

    const ifNoneMatch = req.headers.get('if-none-match') || undefined;
    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch,
    });

    if (!result) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
        },
      });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Content-Length': String(result.blob.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: result.blob.etag,
      },
    });
  } catch (error) {
    console.error('Blob image error:', error);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
