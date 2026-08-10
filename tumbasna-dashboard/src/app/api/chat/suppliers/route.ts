import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/suppliers — Ambil daftar supplier aktif ATAU history chat
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerPhone = searchParams.get('buyerPhone') || '';
    const supplierPhone = searchParams.get('supplierPhone') || '';
    const action = searchParams.get('action') || 'list'; // 'list' or 'history'

    // Jika action=history, ambil chat history antara buyer dan supplier
    if (action === 'history' && buyerPhone && supplierPhone) {
      const messages = await (prisma as any).chatMessage.findMany({
        where: {
          OR: [
            { buyerPhone, supplierPhone },
            { buyerPhone: supplierPhone, supplierPhone: buyerPhone }, // swap untuk cover both directions
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      });

      return NextResponse.json({ success: true, data: messages });
    }

    // Default: ambil daftar supplier aktif
    const suppliers = await prisma.user.findMany({
      where: {
        role: 'PETANI',
        productEntries: {
          some: { status: 'ACTIVE', type: 'SUPPLY' }
        }
      },
      include: {
        productEntries: {
          where: { status: 'ACTIVE', type: 'SUPPLY' },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const result = suppliers.map(s => ({
      id: s.id,
      name: s.name || `Supplier ${s.phoneNumber}`,
      phone: s.phoneNumber,
      location: s.address || '',
      businessName: s.businessName || '',
      activeProducts: s.productEntries.map(p => ({
        commodity: p.commodity,
        qty: p.qty,
        price: p.price,
        imageUrl: (p as any).imageUrl || null,
      })),
      avatarInitial: (s.name || 'S').charAt(0).toUpperCase(),
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[CHAT SUPPLIERS ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/chat/suppliers — Simpan pesan dari buyer ATAU supplier
export async function POST(req: Request) {
  try {
    const { buyerPhone, supplierPhone, message, sender } = await req.json();
    
    // Validasi
    if (!supplierPhone || !message) {
      return NextResponse.json({ error: 'Missing supplierPhone or message' }, { status: 400 });
    }

    if (!sender || !['buyer', 'supplier'].includes(sender)) {
      return NextResponse.json({ error: 'Invalid sender (must be buyer or supplier)' }, { status: 400 });
    }

    // Temukan buyer di DB (jika ada)
    let buyer = null;
    if (buyerPhone) {
      buyer = await prisma.user.findUnique({
        where: { phoneNumber: buyerPhone }
      });
    }

    // Temukan supplier di DB untuk mendapatkan nama
    const supplier = await prisma.user.findUnique({
      where: { phoneNumber: supplierPhone }
    });
    const supplierName = supplier?.name || supplier?.businessName || supplierPhone;

    // Simpan pesan ke tabel chat_messages
    await (prisma as any).chatMessage.create({
      data: {
        buyerUserId: buyer?.id || null,
        buyerPhone: buyerPhone || null,
        supplierPhone,
        supplierName,
        sender,
        text: message,
        status: 'sent'
      }
    });

    // Jika sender = buyer, kirim ke WA supplier
    let waRelaySuccess = false;
    let waRelayError: string | null = null;

    if (sender === 'buyer') {
      const waUrl = process.env.WHATSAPP_BOT_URL || 'http://127.0.0.1:3002';
      const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || 'tumbasna-rahasia-banget';
      
      try {
        const buyerName = buyer?.name || 'Pedagang Tumbasna';
        const businessInfo = buyer?.businessName ? ` _(${buyer.businessName})_` : '';
        const locationInfo = buyer?.address ? ` — ${buyer.address}` : '';
        const waLink = `wa.me/${(buyerPhone || buyer?.phoneNumber || '').replace(/\D/g, '')}`;

        const relayMsg =
          `💬 *Pesan dari Pembeli Tumbasna* 🛒\n` +
          `*Dari:* ${buyerName}${businessInfo}${locationInfo}\n` +
          `*Kontak WA:* ${waLink}\n` +
          `─────────────────────────\n\n` +
          `"${message}"\n\n` +
          `_Balas pesan ini untuk membalas pembeli. Pesan Anda akan otomatis tersimpan di chat history._`;

        const waRes = await fetch(`${waUrl}/api/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-secret-key': waApiKey
          },
          body: JSON.stringify({
            phone: supplierPhone,
            message: relayMsg,
          }),
        });
        
        if (!waRes.ok) {
          const errText = await waRes.text();
          console.warn(`[WA RELAY ERROR] status=${waRes.status}, error=${errText}`);
          waRelayError = `HTTP ${waRes.status}: ${errText}`;
        } else {
          console.log(`[WA RELAY SUCCESS] Pesan terkirim ke ${supplierPhone}`);
          waRelaySuccess = true;
        }
      } catch (waErr: any) {
        console.warn('[WA RELAY] Gagal kirim pesan ke WA supplier, mungkin bot offline:', waErr.message);
        waRelayError = waErr.message || 'Bot WhatsApp Offline';
      }
    }

    return NextResponse.json({ success: true, waRelaySuccess, waRelayError });
  } catch (error: any) {
    console.error('[CHAT POST ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
