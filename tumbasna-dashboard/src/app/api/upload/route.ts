import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgjvicrxagnzvpjesuuu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Jika service key belum dikonfigurasi, degrade gracefully (tidak error fatal)
    if (!SUPABASE_SERVICE_KEY) {
      console.warn('[UPLOAD] SUPABASE_SERVICE_KEY belum diset, skip upload storage.');
      return NextResponse.json({ success: false, url: null, error: 'Storage not configured' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[UPLOAD ERROR] Supabase Storage:', error.message);
      return NextResponse.json({ success: false, url: null, error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    return NextResponse.json({ success: true, url: publicData.publicUrl, path: filename });

  } catch (error: any) {
    console.error('[UPLOAD FATAL ERROR]', error.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
