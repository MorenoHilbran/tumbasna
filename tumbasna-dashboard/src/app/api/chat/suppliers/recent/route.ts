import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/suppliers/recent — Ambil recent chats unik per buyer untuk supplier
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierPhone = searchParams.get('supplierPhone');

    if (!supplierPhone) {
      return NextResponse.json({ error: 'supplierPhone is required' }, { status: 400 });
    }

    const cleaned = supplierPhone.replace(/\D/g, '');
    const altPhone = cleaned.startsWith('62') 
      ? '0' + cleaned.slice(2) 
      : (cleaned.startsWith('0') ? '62' + cleaned.slice(1) : '62' + cleaned);

    // Cari supplierUser untuk mendapatkan variasi nama / nama usaha supplier
    const supplierUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: supplierPhone },
          { phoneNumber: cleaned },
          { phoneNumber: altPhone },
          { name: supplierPhone },
          { businessName: supplierPhone }
        ]
      }
    });

    const supplierNames = supplierUser
      ? [supplierUser.name, supplierUser.businessName, supplierPhone].filter((n): n is string => Boolean(n && n.trim() !== ''))
      : [supplierPhone];

    const allChats = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { supplierPhone: { in: [supplierPhone, cleaned, altPhone] } },
          { supplierName: { in: supplierNames } }
        ],
        sender: 'buyer'
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        buyerPhone: true,
        text: true,
        createdAt: true
      }
    });

    // Deduplicate: ambil pesan terakhir per buyerPhone (data sudah urut desc)
    const seen = new Set<string>();
    const uniqueChats: typeof allChats = [];
    for (const chat of allChats) {
      const key = chat.buyerPhone || '';
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueChats.push(chat);
      }
    }

    // Ambil nama buyer dari tabel user jika ada
    const buyerPhones = uniqueChats.map(c => c.buyerPhone).filter(Boolean) as string[];
    const buyers = buyerPhones.length > 0
      ? await prisma.user.findMany({
          where: { phoneNumber: { in: buyerPhones } },
          select: { phoneNumber: true, name: true, businessName: true }
        })
      : [];

    const buyerMap = new Map(buyers.map(b => [b.phoneNumber, b.name || b.businessName || null]));

    const result = uniqueChats.slice(0, 10).map(chat => ({
      buyerPhone: chat.buyerPhone,
      buyerName: buyerMap.get(chat.buyerPhone || '') || null,
      lastMessage: chat.text,
      lastTime: chat.createdAt,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[RECENT CHATS ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

