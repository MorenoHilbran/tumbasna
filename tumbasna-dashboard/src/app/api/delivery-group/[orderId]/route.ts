import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

type Params = { params: Promise<{ orderId: string }> };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/delivery-group/[orderId]
// Ambil info grup + semua pesan — dipakai oleh mobile untuk polling
export async function GET(_req: Request, { params }: Params) {
  try {
    const { orderId } = await params;

    const group = await prisma.deliveryGroup.findUnique({
      where: { orderId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        order: {
          select: {
            supplierName: true,
            courier: true,
            status: true,
            buyer: { select: { name: true, businessName: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grup chat belum dibuat untuk pesanan ini' },
        { status: 404, headers: corsHeaders }
      );
    }

    const driverLink = group.driverAccessToken
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.tumbasna.my.id'}/delivery/${group.driverAccessToken}`
      : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: group.id,
          orderId: group.orderId,
          status: group.status,
          driverName: group.driverName,
          driverPhone: group.driverPhone,
          driverLink,
          supplierName: group.order.supplierName,
          courier: group.order.courier,
          orderStatus: group.order.status,
          buyerName: group.order.buyer?.businessName || group.order.buyer?.name || 'Pembeli',
          createdAt: group.createdAt.toISOString(),
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
    console.error('[DELIVERY GROUP GET ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/delivery-group/[orderId]
// Buat grup baru saat order masuk status DIKIRIM
// Body (optional): { driverName?, driverPhone?, systemMessage? }
export async function POST(req: Request, { params }: Params) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const { driverName, driverPhone, systemMessage } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { name: true, businessName: true } },
        items: { take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order tidak ditemukan' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Idempotent: kembalikan yang sudah ada
    const existing = await prisma.deliveryGroup.findUnique({ where: { orderId } });
    if (existing) {
      return NextResponse.json(
        { success: true, data: existing, message: 'Grup sudah ada' },
        { headers: corsHeaders }
      );
    }

    // Generate token unik untuk akses kurir via link web
    const driverAccessToken = crypto.randomUUID();

    const buyerName = order.buyer?.businessName || order.buyer?.name || 'Pembeli';

    const defaultSysMsg =
      systemMessage ||
      `🚴 Pesanan *${orderId}* sedang dalam perjalanan.\n\n` +
      `• Supplier: ${order.supplierName}\n` +
      `• Pembeli: ${buyerName}\n` +
      `• Kurir: ${driverName ? `${driverName} (${order.courier})` : order.courier}\n\n` +
      `Chat ini terbuka untuk koordinasi pengiriman. Semua pihak bisa mengirim pesan di sini.`;

    const group = await prisma.deliveryGroup.create({
      data: {
        orderId,
        status: 'ACTIVE',
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        driverAccessToken,
        messages: {
          create: {
            senderRole: 'system',
            senderName: 'Tumbasna',
            text: defaultSysMsg,
            isSystemMessage: true,
          },
        },
      },
      include: { messages: true },
    });

    const driverLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.tumbasna.my.id'}/delivery/${driverAccessToken}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: group.id,
          orderId: group.orderId,
          status: group.status,
          driverName: group.driverName,
          driverPhone: group.driverPhone,
          driverAccessToken: group.driverAccessToken,
          driverLink,
          messages: group.messages.map((m) => ({
            id: m.id,
            senderRole: m.senderRole,
            senderName: m.senderName,
            text: m.text,
            isSystemMessage: m.isSystemMessage,
            timestamp: m.createdAt.toISOString(),
          })),
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[DELIVERY GROUP POST ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/delivery-group/[orderId]
// Update info grup: driverName/driverPhone, atau tutup grup (status=CLOSED)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const { status, driverName, driverPhone } = body;

    const existing = await prisma.deliveryGroup.findUnique({ where: { orderId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Grup tidak ditemukan' },
        { status: 404, headers: corsHeaders }
      );
    }

    const updated = await prisma.deliveryGroup.update({
      where: { orderId },
      data: {
        ...(status && { status }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
      },
    });

    // Jika grup baru ditutup, tambah system message penutup
    if (status === 'CLOSED' && existing.status !== 'CLOSED') {
      await prisma.deliveryGroupMessage.create({
        data: {
          groupId: existing.id,
          senderRole: 'system',
          senderName: 'Tumbasna',
          text: '✅ Pesanan telah selesai. Chat pengiriman ini telah ditutup. Terima kasih telah menggunakan Tumbasna!',
          isSystemMessage: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[DELIVERY GROUP PATCH ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
