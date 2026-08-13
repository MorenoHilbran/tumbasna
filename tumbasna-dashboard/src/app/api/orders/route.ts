import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getProductImage(commodityName: string, userProvidedImg?: string | null): string {
  if (userProvidedImg && typeof userProvidedImg === 'string' && userProvidedImg.startsWith('http')) {
    return userProvidedImg.replace(/^(URL Foto:\s*|url foto:\s*)/i, '').trim();
  }
  const name = commodityName.toLowerCase();
  if (name.includes('cabai merah') || name.includes('cabe merah')) return '/image/produk/cabaimerah.png';
  if (name.includes('cabai rawit') || name.includes('cabe rawit') || name.includes('cabai') || name.includes('cabe')) return '/image/produk/cabairawit.png';
  if (name.includes('bawang merah')) return '/image/produk/bawangmerah.png';
  if (name.includes('bawang putih')) return '/image/produk/bawangputih.png';
  if (name.includes('beras')) return '/image/produk/beras.png';
  if (name.includes('jagung')) return '/image/produk/jagung.png';
  if (name.includes('jahe')) return '/image/produk/jahe.png';
  if (name.includes('kentang')) return '/image/produk/kentang.png';
  if (name.includes('tomat')) return '/image/produk/tomat.png';
  if (name.includes('melon')) return '/image/produk/melon.png';
  if (name.includes('semangka')) return '/image/produk/semangka.png';
  if (name.includes('wortel')) return '/image/produk/wortel.png';
  if (name.includes('telur')) return '/image/produk/telur.png';
  if (name.includes('daging') || name.includes('sapi')) return '/image/produk/dagingsapi.png';
  if (name.includes('ayam')) return '/image/produk/dagingayam.png';
  if (name.includes('ikan')) return '/image/produk/ikan.png';
  if (name.includes('udang')) return '/image/produk/udang.png';
  if (name.includes('minyak')) return '/image/produk/minyak.png';
  if (name.includes('gula')) return '/image/produk/gula.png';
  return '/image/produk/cabaimerah.png';
}

// GET /api/orders?userId=<uuid>  — ambil semua pesanan milik buyer
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');

    // Jika userId ada dan merupakan UUID valid, filter by buyerUserId. 
    // Jika phone ada, cari user berdasarkan nomor telepon lalu ambil pesanan milik supplier tersebut.

    let whereClause: any = {};
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        // userId tidak valid (mis. mock-xxx), kembalikan array kosong
        return NextResponse.json({ success: true, data: [] });
      } else {
        whereClause = { buyerUserId: userId };
      }
    } else if (phone) {
      const normalizedPhone = phone.replace(/^\+/, '').replace(/^0/, '62');
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: normalizedPhone },
            { phoneNumber: phone },
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ success: true, data: [] });
      }

      whereClause = {
        OR: [
          { supplierName: user.name || '' },
          ...(user.businessName ? [{ supplierName: user.businessName }] : [])
        ]
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: true,
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
      buyerName: order.buyer?.name || order.buyer?.businessName || 'Pedagang Tumbasna',
      buyerAddress: order.buyer?.address || '',
      courier: order.courier,
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      date: new Date(order.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: order.status === 'MENUNGGU_PEMBAYARAN' ? 'Menunggu Pembayaran'
            : order.status === 'DIPROSES' ? 'Diproses'
            : order.status === 'DIKIRIM' ? 'Dikirim'
            : order.status === 'SELESAI' ? 'Selesai'
            : order.status === 'DIBATALKAN' ? 'Dibatalkan'
            : order.status,
      rawStatus: order.status,
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
          image: getProductImage(item.commodity, item.productEntry?.image),
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
      notes,
    } = body;

    if (!id || !supplierName || !courier || !items?.length) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    let validBuyerUserId = null;
    if (buyerUserId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(buyerUserId)) {
        validBuyerUserId = buyerUserId;
      }
    }

    const order = await prisma.order.create({
      data: {
        id,
        buyerUserId: validBuyerUserId,
        supplierName,
        supplierLocation,
        courier,
        shippingCost: Number(shippingCost || 0),
        totalAmount: Number(totalAmount || 0),
        status: 'MENUNGGU_PEMBAYARAN',
        paymentQrCode: paymentQrCode || null,
        fundsReleased: false,
        trackingTimeline: trackingTimeline || [],
        notes: notes || null,
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

    // Kirim notifikasi WA ke supplier bahwa ada pesanan baru masuk
    try {
      let supplierUser: any = null;

      // 1. Multi-stage Supplier Lookup: productEntryId/id -> commodity -> supplierName -> token match -> default PETANI
      for (const item of (items || [])) {
        const targetId = item.productEntryId || item.id;
        if (targetId && typeof targetId === 'string' && !targetId.startsWith('prod-')) {
          try {
            const pEntry = await prisma.productEntry.findUnique({
              where: { id: targetId },
              include: { user: true }
            });
            if (pEntry?.user) {
              supplierUser = pEntry.user;
              break;
            }
          } catch {}
        }
      }

      if (!supplierUser) {
        for (const item of (items || [])) {
          if (item.commodity) {
            const commLower = item.commodity.toLowerCase().trim();
            try {
              const pEntry = await prisma.productEntry.findFirst({
                where: {
                  commodity: { contains: commLower, mode: 'insensitive' }
                },
                include: { user: true }
              });
              if (pEntry?.user) {
                supplierUser = pEntry.user;
                break;
              }
            } catch {}
          }
        }
      }

      if (!supplierUser) {
        const searchNames = Array.from(new Set([
          supplierName,
          items?.[0]?.supplierName,
        ].filter(Boolean))) as string[];

        for (const rawName of searchNames) {
          const cleanName = rawName.trim();
          if (!cleanName) continue;

          supplierUser = await prisma.user.findFirst({
            where: {
              OR: [
                { name: { equals: cleanName, mode: 'insensitive' } },
                { businessName: { equals: cleanName, mode: 'insensitive' } },
                { name: { contains: cleanName, mode: 'insensitive' } },
                { businessName: { contains: cleanName, mode: 'insensitive' } },
              ]
            }
          });
          if (supplierUser) break;

          const allUsers = await prisma.user.findMany({});
          const targetLower = cleanName.toLowerCase();

          supplierUser = allUsers.find(u => {
            const uName = (u.name || '').toLowerCase();
            const bName = (u.businessName || '').toLowerCase();
            if (!uName && !bName) return false;

            if (uName && (targetLower.includes(uName) || uName.includes(targetLower))) return true;
            if (bName && (targetLower.includes(bName) || bName.includes(targetLower))) return true;

            const tokens = targetLower.split(/\s+/).filter(t => t.length > 2);
            for (const tok of tokens) {
              if ((uName && uName.includes(tok)) || (bName && bName.includes(tok))) return true;
            }
            return false;
          }) || null;

          if (supplierUser) break;
        }
      }

      if (!supplierUser) {
        supplierUser = await prisma.user.findFirst({ where: { role: 'PETANI' } });
      }

      // 3. Ambil info pembeli jika ada
      let buyerName = 'Pedagang Tumbasna';
      if (validBuyerUserId) {
        const buyer = await prisma.user.findUnique({ where: { id: validBuyerUserId } });
        if (buyer) buyerName = buyer.name || buyer.businessName || buyerName;
      }

      if (supplierUser?.phoneNumber) {
        const itemsDesc = items.map((it: any) =>
          `  • ${it.commodity.toUpperCase()} — ${Number(it.qty)} kg × Rp ${Number(it.price).toLocaleString('id-ID')}/kg`
        ).join('\n');
        const formattedTotal = Number(totalAmount || 0).toLocaleString('id-ID');

        const msg = `📢 *TUMBASNA: PESANAN BARU MASUK* 🌾\n\n` +
          `Halo Bpk/Ibu *${supplierUser.name || supplierUser.businessName || 'Supplier'}*,\n` +
          `Ada pesanan baru untuk komoditas Juragan!\n\n` +
          `• ID Pesanan: *${id}*\n` +
          `• Pembeli: *${buyerName}*\n` +
          `• Kurir: *${courier}*\n` +
          `• Rincian Barang:\n${itemsDesc}\n` +
          `• Total Nilai: *Rp ${formattedTotal}*\n` +
          `• Status: *Menunggu Pembayaran*\n\n` +
          `Kami akan memberi tahu Juragan kembali begitu pembayaran dikonfirmasi oleh Escrow Tumbasna. ` +
          `Mohon jangan memproses barang sebelum ada notifikasi pembayaran lunas. 🤝`;

        const botUrls = Array.from(new Set([
          process.env.WHATSAPP_BOT_URL,
          process.env.WA_BOT_URL,
          'http://127.0.0.1:3002',
          'http://localhost:3002',
          'http://127.0.0.1:3001',
          'http://localhost:3001',
          'http://whatsapp-bot:3002'
        ].filter(Boolean))) as string[];

        const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || 'tumbasna-rahasia-banget';

        for (const botUrl of botUrls) {
          try {
            const res = await fetch(`${botUrl}/api/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-secret-key': waApiKey },
              body: JSON.stringify({ phone: supplierUser.phoneNumber, message: msg }),
              signal: AbortSignal.timeout(4000)
            });
            if (res.ok) {
              console.log(`💬 [WA ORDER CREATED] Notifikasi terkirim via ${botUrl} ke ${supplierUser.phoneNumber}`);
              break;
            }
          } catch (waErr: any) {
            console.warn(`[WA ORDER WARN] Gagal via ${botUrl}:`, waErr.message);
          }
        }
      } else {
        console.warn(`⚠️ [WA ORDER NOTIF] Supplier tidak ditemukan atau tidak punya nomor telepon untuk "${supplierName}"`);
      }
    } catch (notifErr: any) {
      console.warn(`⚠️ [WA ORDER NOTIF ERROR] Gagal kirim notifikasi pesanan baru:`, notifErr.message);
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });

  } catch (error: any) {
    console.error('[API ORDERS POST ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
