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
      const cleanBuyer = buyerPhone.replace(/\D/g, '');
      const altBuyer = cleanBuyer.startsWith('62') ? '0' + cleanBuyer.slice(2) : (cleanBuyer.startsWith('0') ? '62' + cleanBuyer.slice(1) : cleanBuyer);

      const cleanSupplier = supplierPhone.replace(/\D/g, '');
      const altSupplier = cleanSupplier.startsWith('62') ? '0' + cleanSupplier.slice(2) : (cleanSupplier.startsWith('0') ? '62' + cleanSupplier.slice(1) : cleanSupplier);

      const buyerPhoneVariants = [buyerPhone, cleanBuyer, altBuyer];
      const supplierPhoneVariants = [supplierPhone, cleanSupplier, altSupplier];

      const messages = await (prisma as any).chatMessage.findMany({
        where: {
          OR: [
            { buyerPhone: { in: buyerPhoneVariants }, supplierPhone: { in: supplierPhoneVariants } },
            { buyerPhone: { in: supplierPhoneVariants }, supplierPhone: { in: buyerPhoneVariants } }, // swap untuk cover both directions
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
    const { buyerPhone, supplierPhone, message, sender, buyerName: bodyBuyerName } = await req.json();
    
    const supplierPhoneTrimmed = (supplierPhone || '').trim();
    const messageTrimmed = (message || '').trim();

    // Validasi — sertakan detail field yang menyebabkan error
    if (!supplierPhoneTrimmed || !messageTrimmed) {
      const missing = [];
      if (!supplierPhoneTrimmed) missing.push(`supplierPhone (got: ${JSON.stringify(supplierPhone)})`);
      if (!messageTrimmed) missing.push(`message (got: ${JSON.stringify(message)})`);
      console.error('[CHAT POST 400] Missing fields:', missing.join(', '), '| sender:', sender, '| buyerPhone:', buyerPhone);
      return NextResponse.json({ error: 'Missing required fields', missing }, { status: 400 });
    }

    if (!sender || !['buyer', 'supplier'].includes(sender)) {
      console.error('[CHAT POST 400] Invalid sender:', JSON.stringify(sender));
      return NextResponse.json({ error: 'Invalid sender (must be buyer or supplier)', got: sender }, { status: 400 });
    }

    // Temukan buyer di DB (jika ada) - coba variasi format 08 / 628
    let buyer = null;
    if (buyerPhone) {
      const cleaned = buyerPhone.replace(/\D/g, '');
      const altPhone = cleaned.startsWith('62') 
        ? '0' + cleaned.slice(2) 
        : (cleaned.startsWith('0') ? '62' + cleaned.slice(1) : '62' + cleaned);

      buyer = await prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: buyerPhone },
            { phoneNumber: cleaned },
            { phoneNumber: altPhone }
          ]
        }
      });
    }

    // Temukan supplier di DB untuk mendapatkan nama
    const supplier = await prisma.user.findUnique({
      where: { phoneNumber: supplierPhoneTrimmed }
    });
    const supplierName = supplier?.name || supplier?.businessName || supplierPhoneTrimmed;

    // Simpan pesan ke tabel chat_messages
    await (prisma as any).chatMessage.create({
      data: {
        buyerUserId: buyer?.id || null,
        buyerPhone: buyerPhone || null,
        supplierPhone: supplierPhoneTrimmed,
        supplierName,
        sender,
        text: messageTrimmed,
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
        const rawName = (bodyBuyerName || buyer?.name || buyer?.businessName || 'Pembeli Tumbasna').trim();
        const finalBuyerName = (rawName === 'Pedagang Tumbasna' || !rawName) ? 'Pembeli Tumbasna' : rawName;
        const businessInfo = (buyer?.businessName && buyer?.businessName !== finalBuyerName) ? ` (${buyer.businessName})` : '';

        const relayMsg =
          `🛒 *Pesan Baru dari ${finalBuyerName}${businessInfo}*\n\n` +
          `"${messageTrimmed}"\n\n` +
          `_Balas pesan ini untuk membalas pembeli._`;

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
    console.error('[CHAT POST ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined 
    }, { status: 500 });
  }
}

