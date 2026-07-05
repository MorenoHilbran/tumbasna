import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    try {
      const sessions = await prisma.chatSession.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      
      const users = await prisma.user.findMany();
      
      const mappedSessions = sessions.map(session => {
        const history = Array.isArray(session.history) ? session.history : [];
        const metadata = (history as any[]).find((msg: any) => msg.role === 'metadata');
        const mappedPhone = metadata?.mappedPhone || null;
        
        // Cari user yang sesuai berdasarkan no telp asli atau terpetakan
        const user = users.find(u => 
          u.phoneNumber === session.phoneNumber || 
          (mappedPhone && u.phoneNumber === mappedPhone)
        );
        
        return {
          phoneNumber: session.phoneNumber,
          mappedPhone,
          userName: user?.name || null,
          updatedAt: session.updatedAt,
          history: history // Tetap kembalikan history lengkap agar admin bisa melihat metadata juga jika butuh, atau disaring di frontend
        };
      });
      
      return NextResponse.json({ success: true, data: mappedSessions });
    } catch (error: any) {
      console.error('[API GET ALL SESSIONS ERROR]', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { phoneNumber: phone },
    });
    
    // history di Prisma adalah tipe Json — sudah berupa array/object, TIDAK perlu JSON.parse
    const history = Array.isArray(session?.history) ? session.history : [];
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('[API GET SESSION ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, history, action } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
    }

    if (action === 'DELETE') {
      await prisma.chatSession.deleteMany({
        where: { phoneNumber: phone },
      });
      return NextResponse.json({ success: true, message: 'Session cleared' });
    }

    if (history === undefined) {
      return NextResponse.json({ error: 'Payload history is required' }, { status: 400 });
    }

    // Simpan history langsung sebagai Json (tidak stringify — Prisma handle sendiri)
    const session = await prisma.chatSession.upsert({
      where: { phoneNumber: phone },
      update: { history: history },
      create: { phoneNumber: phone, history: history },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error('[API POST SESSION ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
