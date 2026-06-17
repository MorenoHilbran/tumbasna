import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { phoneNumber: phone },
    });
    
    let history = [];
    if (session?.history) {
      try {
        history = JSON.parse(session.history);
      } catch (e) {
        console.error('Failed to parse history JSON from DB:', e);
      }
    }
    // Default kembalikan array kosong jika belum ada memori
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

    if (history === undefined && body.isWhitelisted === undefined) {
      return NextResponse.json({ error: 'Payload (history or isWhitelisted) is required' }, { status: 400 });
    }

    const updateData: any = {};
    const createData: any = { phoneNumber: phone };
    
    if (history !== undefined) {
        const historyStr = JSON.stringify(history);
        updateData.history = historyStr;
        createData.history = historyStr;
    }
    if (body.isWhitelisted !== undefined) {
        updateData.isWhitelisted = body.isWhitelisted;
        createData.isWhitelisted = body.isWhitelisted;
    }

    const session = await prisma.chatSession.upsert({
      where: { phoneNumber: phone },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error('[API POST SESSION ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
