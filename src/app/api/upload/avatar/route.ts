import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { NextResponse } from 'next/server';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function extFor(fileName: string, mime: string): string {
  const fromName = extname(fileName || '').toLowerCase();
  if (fromName) return fromName;
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '.bin';
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Missing file.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: 'Unsupported image type.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'Image too large (max 2MB).' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    const ext = extFor(file.name, file.type);
    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const absPath = join(uploadsDir, fileName);
    await writeFile(absPath, buf);

    const url = `/uploads/avatars/${fileName}`;
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

