import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/orders?userId=<uuid>  — ambil semua pesanan milik buyer
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Jika userId ada dan merupakan UUID valid, filter by buyerUserId. 
    // Jika userId ada tapi tidak valid (misal user mock), kembalikan array kosong.
    // Jika userId tidak ada, ambil semua (untuk admin dashboard).
    let whereClause = {};
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause = { buyerUserId: userId };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            productEntry: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Mapping ke format yang digunakan mobile AppContext
    const mapped = orders.map((order) => ({
      id: order.id,
      supplierName: order.supplierName,
      supplierLocation: order.supplierLocation,
      courier: order.courier,
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      date: new Date(order.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: order.status,
      paymentQrCode: order.paymentQrCode || '',
      fundsReleased: order.fundsReleased,
      notes: order.notes || '',
      trackingTimeline: order.trackingTimeline,
      paymentCountdown: 0,
      items: order.items.map((item) => ({
        quantity: Number(item.qty),
        product: {
          id: item.productEntryId || item.id,
          name: item.commodity
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          price: Number(item.price),
          stock: 0,
          supplierName: item.supplierName,
          supplierLocation: order.supplierLocation,
          supplierRating: 4.8,
          image: '/image/produk/' + item.commodity.replace(/\s+/g, '').toLowerCase() + '.png',
          description: `Komoditas ${item.commodity} dari ${order.supplierLocation}.`,
          shippingEstimate: '1-3 Hari',
          category: item.commodity,
          priceHistory: [],
        },
      })),
    }));

    return NextResponse.json({ success: true, data: mapped });

  } catch (error: any) {
    console.error('[API ORDERS GET ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/orders  — buat pesanan baru dari mobile checkout
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      buyerUserId,
      supplierName,
      supplierLocation,
      courier,
      shippingCost,
      totalAmount,
      items,             // Array<{ productEntryId?, commodity, price, qty, supplierName }>
      trackingTimeline,
      paymentQrCode,
    } = body;

    if (!id || !supplierName || !courier || !items?.length) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        id,
        buyerUserId: buyerUserId || null,
        supplierName,
        supplierLocation,
        courier,
        shippingCost: Number(shippingCost || 0),
        totalAmount: Number(totalAmount || 0),
        status: 'MENUNGGU_PEMBAYARAN',
        paymentQrCode: paymentQrCode || null,
        fundsReleased: false,
        trackingTimeline: trackingTimeline || [],
        items: {
          create: items.map((item: any) => ({
            productEntryId: item.productEntryId || null,
            commodity: item.commodity.toLowerCase(),
            price: Number(item.price),
            qty: Number(item.qty),
            supplierName: item.supplierName,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });

  } catch (error: any) {
    console.error('[API ORDERS POST ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
