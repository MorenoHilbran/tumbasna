import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ orderId: string }> };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/delivery-group/[orderId]/messages?since=ISO_TIMESTAMP
// Polling pesan baru saja — efisien untuk mobile
export async function GET(req: Request, { params }: Params) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');

    const group = await prisma.deliveryGroup.findUnique({ where: { orderId } });
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grup tidak ditemukan' },
        { status: 404, headers: corsHeaders }
      );
    }

    const where: any = { groupId: group.id };
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.deliveryGroupMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json(
      {
        success: true,
        data: messages.map((msg) => ({
          id: msg.id,
          senderRole: msg.senderRole,
          senderName: msg.senderName,
          text: msg.text,
          isSystemMessage: msg.isSystemMessage,
          timestamp: msg.createdAt.toISOString(),
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[DELIVERY GROUP MESSAGES GET ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/delivery-group/[orderId]/messages
// Kirim pesan baru ke grup
// Body: { senderRole: 'buyer'|'supplier'|'driver'|'system', senderName: string, text: string, isSystemMessage?: boolean }
export async function POST(req: Request, { params }: Params) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const { senderRole, senderName, text, isSystemMessage } = body;

    if (!senderRole || !senderName || !text) {
      return NextResponse.json(
        { success: false, error: 'senderRole, senderName, dan text wajib diisi' },
        { status: 400, headers: corsHeaders }
      );
    }

    const group = await prisma.deliveryGroup.findUnique({ where: { orderId } });
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grup tidak ditemukan' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Jika grup sudah tertutup, tolak pesan baru (kecuali dari system)
    if (group.status === 'CLOSED' && senderRole !== 'system') {
      return NextResponse.json(
        { success: false, error: 'Chat ini sudah ditutup karena pesanan selesai' },
        { status: 403, headers: corsHeaders }
      );
    }

    const message = await prisma.deliveryGroupMessage.create({
      data: {
        groupId: group.id,
        senderRole,
        senderName,
        text,
        isSystemMessage: isSystemMessage ?? false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          senderRole: message.senderRole,
          senderName: message.senderName,
          text: message.text,
          isSystemMessage: message.isSystemMessage,
          timestamp: message.createdAt.toISOString(),
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[DELIVERY GROUP MESSAGES POST ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
