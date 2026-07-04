import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/suppliers — Ambil daftar supplier aktif dari DB
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerPhone = searchParams.get('buyerPhone') || '';

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

// POST /api/chat/suppliers — Simpan pesan dari buyer ke DB (untuk relay ke WA supplier)
export async function POST(req: Request) {
  try {
    const { buyerPhone, supplierPhone, message } = await req.json();
    if (!buyerPhone || !supplierPhone || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Temukan buyer di DB untuk dihubungkan ke ChatMessage
    const buyer = await prisma.user.findUnique({
      where: { phoneNumber: buyerPhone }
    });

    // Simpan pesan ke tabel chat_messages
    await prisma.chatMessage.create({
      data: {
        buyerUserId: buyer?.id || null,
        supplierName: supplierPhone,
        sender: 'buyer',
        text: message,
        status: 'sent'
      }
    });

    // Kirim pesan ke WA supplier via tumbasna-whatsapp /api/send
    const waUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3002';
    const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || 'tumbasna-rahasia-banget';
    try {
      const waRes = await fetch(`${waUrl}/api/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-secret-key': waApiKey 
        },
        body: JSON.stringify({
          phone: supplierPhone,
          message: `💬 *Pesan dari pembeli Tumbasna:*\n${message}`,
        }),
      });
      if (!waRes.ok) {
        console.warn(`[WA RELAY ERROR] status=${waRes.status}`);
      } else {
        console.log(`[WA RELAY SUCCESS] Pesan terkirim ke ${supplierPhone}`);
      }
    } catch (waErr: any) {
      console.warn('[WA RELAY] Gagal kirim pesan ke WA supplier, mungkin bot offline:', waErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CHAT POST ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
