import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/orders/[id]  — update status pesanan (bayar, konfirmasi terima)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, trackingTimeline, fundsReleased } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingTimeline !== undefined && { trackingTimeline }),
        ...(fundsReleased !== undefined && { fundsReleased }),
      },
    });

    return NextResponse.json({ success: true, data: order });

  } catch (error: any) {
    console.error('[API ORDERS PATCH ERROR]', error.message);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/orders/[id]  — detail satu pesanan
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });

  } catch (error: any) {
    console.error('[API ORDERS GET ONE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
