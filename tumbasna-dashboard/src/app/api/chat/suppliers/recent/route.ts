import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/suppliers/recent — Ambil recent chats untuk supplier
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierPhone = searchParams.get('supplierPhone');

    if (!supplierPhone) {
      return NextResponse.json({ error: 'supplierPhone is required' }, { status: 400 });
    }

    // Ambil chat terakhir yang diterima supplier dari buyer (dalam 24 jam terakhir)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentChats = await prisma.chatMessage.findMany({
      where: {
        supplierPhone,
        sender: 'buyer',
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        buyerPhone: true,
        text: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, data: recentChats });
  } catch (error: any) {
    console.error('[RECENT CHATS ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
