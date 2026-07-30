import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ token: string }> };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/delivery-group/driver/[token]
// Akses driver via token — tidak memerlukan login
// Mengembalikan info grup + pesan untuk halaman web kurir
export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;

    const group = await prisma.deliveryGroup.findUnique({
      where: { driverAccessToken: token },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        order: {
          select: {
            id: true,
            supplierName: true,
            supplierLocation: true,
            courier: true,
            status: true,
            buyerAddress: true,
            buyerPhone: true,
            buyer: { select: { name: true, businessName: true, address: true } },
            items: {
              select: { commodity: true, qty: true },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Link tidak valid atau sudah kadaluarsa' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          groupId: group.id,
          orderId: group.orderId,
          status: group.status,
          driverName: group.driverName,
          // Data pesanan untuk kurir
          order: {
            id: group.order.id,
            supplierName: group.order.supplierName,
            supplierLocation: group.order.supplierLocation,
            courier: group.order.courier,
            orderStatus: group.order.status,
            buyerName:
              group.order.buyer?.businessName ||
              group.order.buyer?.name ||
              'Pembeli',
            buyerAddress: group.order.buyerAddress || group.order.buyer?.address || '',
            buyerPhone: group.order.buyerPhone || '',
            items: group.order.items.map((it) => ({
              commodity: it.commodity,
              qty: Number(it.qty),
            })),
          },
          messages: group.messages.map((msg) => ({
            id: msg.id,
            senderRole: msg.senderRole,
            senderName: msg.senderName,
            text: msg.text,
            isSystemMessage: msg.isSystemMessage,
            timestamp: msg.createdAt.toISOString(),
          })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[DRIVER TOKEN GET ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/delivery-group/driver/[token]/messages
// Kurir kirim pesan via token — tidak perlu login
// Body: { driverName: string, text: string }
export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { driverName, text } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Teks pesan wajib diisi' },
        { status: 400, headers: corsHeaders }
      );
    }

    const group = await prisma.deliveryGroup.findUnique({
      where: { driverAccessToken: token },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Link tidak valid atau sudah kadaluarsa' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (group.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Chat ini sudah ditutup karena pesanan selesai' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update nama kurir jika baru diisi
    const resolvedDriverName = driverName || group.driverName || 'Kurir';
    if (driverName && driverName !== group.driverName) {
      await prisma.deliveryGroup.update({
        where: { id: group.id },
        data: { driverName: resolvedDriverName },
      });
    }

    const message = await prisma.deliveryGroupMessage.create({
      data: {
        groupId: group.id,
        senderRole: 'driver',
        senderName: resolvedDriverName,
        text,
        isSystemMessage: false,
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
          timestamp: message.createdAt.toISOString(),
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[DRIVER TOKEN POST ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
