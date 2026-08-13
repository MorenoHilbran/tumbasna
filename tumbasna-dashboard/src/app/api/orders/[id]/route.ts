import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

// Helper untuk kirim notifikasi via WhatsApp bot
async function sendWANotification(phone: string, message: string) {
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
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': waApiKey
        },
        body: JSON.stringify({ phone, message }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        console.log(`💬 [WA NOTIFICATION] Berhasil kirim via ${botUrl} ke ${phone}`);
        return true;
      }
    } catch (err: any) {
      console.warn(`⚠️ [WA NOTIFICATION WARN] Gagal via ${botUrl} ke ${phone}:`, err.message);
    }
  }
  return false;
}

// Helper untuk mencari supplier secara fleksibel (exact, case-insensitive, partial, atau commodity match)
async function findSupplierUser(supplierName: string, items?: any[]) {
  // 1. Try matching productEntryId or id from items
  for (const item of (items || [])) {
    const targetId = item.productEntryId || item.id;
    if (targetId && typeof targetId === 'string' && !targetId.startsWith('prod-')) {
      try {
        const pEntry = await prisma.productEntry.findUnique({
          where: { id: targetId },
          include: { user: true }
        });
        if (pEntry?.user) return pEntry.user;
      } catch {}
    }
  }

  // 2. Try matching commodity name from items in ProductEntry table (latest active entry)
  for (const item of (items || [])) {
    if (item.commodity) {
      const commLower = item.commodity.toLowerCase().trim();
      try {
        const pEntry = await prisma.productEntry.findFirst({
          where: {
            commodity: { contains: commLower, mode: 'insensitive' }
          },
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        });
        if (pEntry?.user) return pEntry.user;
      } catch {}
    }
  }

  if (!supplierName) return await prisma.user.findFirst({ where: { role: 'PETANI' } });
  const cleanName = supplierName.trim();

  // 3. Exact / mode insensitive / contains match
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { equals: cleanName, mode: 'insensitive' } },
        { businessName: { equals: cleanName, mode: 'insensitive' } },
        { name: { contains: cleanName, mode: 'insensitive' } },
        { businessName: { contains: cleanName, mode: 'insensitive' } }
      ]
    }
  });
  if (user) return user;

  // 4. Word token overlap search across all users
  const allUsers = await prisma.user.findMany({});
  const targetLower = cleanName.toLowerCase();
  
  user = allUsers.find(u => {
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

  if (user) return user;

  // 5. Ultimate fallback: Return first supplier user (PETANI) in database
  return await prisma.user.findFirst({ where: { role: 'PETANI' } });
}

// PATCH /api/orders/[id]  — update status pesanan (bayar, konfirmasi terima)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, trackingTimeline, fundsReleased, waybillNumber, waybillCourier, waybillImageUrl } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 });
    }

    const upperStatus = String(status).toUpperCase();

    // 1. Ambil order lama untuk melihat status transisi dan data supplier
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    let shouldReleaseFunds = false;
    const existingStatusUpper = (existingOrder.status || '').toUpperCase();

    // Jika status baru adalah SELESAI atau fundsReleased=true, dan sebelumnya belum dirilis
    if (
      (upperStatus === 'SELESAI' || fundsReleased === true) &&
      !existingOrder.fundsReleased
    ) {
      shouldReleaseFunds = true;
    }

    // Merge waybill info ke dalam notes (JSON) jika ada
    let mergedNotes: string | null = existingOrder.notes as string | null;
    if (waybillNumber || waybillImageUrl) {
      let notesObj: Record<string, any> = {};
      try {
        if (mergedNotes) notesObj = JSON.parse(mergedNotes);
      } catch {}
      if (waybillNumber) notesObj.waybillNumber = waybillNumber;
      if (waybillCourier) notesObj.waybillCourier = waybillCourier;
      if (waybillImageUrl) notesObj.waybillImageUrl = waybillImageUrl;
      mergedNotes = JSON.stringify(notesObj);
    }

    // 2. Lakukan update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: upperStatus as any,
        ...(trackingTimeline !== undefined && { trackingTimeline }),
        ...(mergedNotes !== existingOrder.notes && { notes: mergedNotes }),
        fundsReleased: shouldReleaseFunds ? true : (fundsReleased !== undefined ? fundsReleased : existingOrder.fundsReleased),
      },
    });

    // 3. Jika perlu merilis dana ke saldo supplier (Escrow Release)
    let supplierUser: any = null;
    if (shouldReleaseFunds) {
      const commodityTotal = existingOrder.items.reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.qty);
      }, 0);

      const releaseAmount = commodityTotal > 0 ? commodityTotal : Number(existingOrder.totalAmount);

      supplierUser = await findSupplierUser(existingOrder.supplierName, existingOrder.items);

      if (supplierUser && releaseAmount > 0) {
        await prisma.user.update({
          where: { id: supplierUser.id },
          data: {
            balance: {
              increment: releaseAmount
            }
          }
        });
        console.log(`💰 [ESCROW RELEASE] Berhasil mencairkan dana Rp ${releaseAmount.toLocaleString('id-ID')} ke saldo supplier ${supplierUser.name} untuk order ${id}`);
      }
    }

    // 4. Kirim Notifikasi WhatsApp Otomatis jika terjadi perubahan status atau konfirmasi pembayaran
    try {
      const supplier = supplierUser || await findSupplierUser(existingOrder.supplierName, existingOrder.items);
      const buyer = existingOrder.buyerUserId ? await prisma.user.findUnique({
        where: { id: existingOrder.buyerUserId }
      }) : null;

      const itemsDescription = existingOrder.items.map(it => `${it.commodity.toUpperCase()} (${Number(it.qty)} kg)`).join(', ');
      const formattedTotal = Number(existingOrder.totalAmount).toLocaleString('id-ID');

      // Kirim notifikasi ke Supplier (Petani)
      if (supplier?.phoneNumber) {
        let msg = '';
        if (upperStatus === 'DIPROSES' || upperStatus === 'MENUNGGU_PEMBAYARAN') {
          msg = `📢 *TUMBASNA NOTIFIKASI PESANAN MASUK* 🌾\n\nHalo Bpk/Ibu *${supplier.name || supplier.businessName || 'Supplier'}*,\n` +
            `Ada transaksi pesanan baru yang telah dibayar/dikonfirmasi oleh pembeli!\n\n` +
            `• ID Pesanan: *${id}*\n` +
            `• Komoditas: *${itemsDescription}*\n` +
            `• Kurir Pilihan: *${existingOrder.courier}*\n` +
            `• Total Nilai: *Rp ${formattedTotal}*\n` +
            `• Status: *LUNAS (Diproses)*\n\n` +
            `Silakan siapkan barang dengan kualitas terbaik dan serahkan ke kurir pilihan. ` +
            `Setelah dikirim, ketik *KIRIM ${id}* di WhatsApp ini. Terima kasih! 📦`;
        } else if (upperStatus === 'DIKIRIM') {
          msg = `🚚 *TUMBASNA PENGIRIMAN AKTIF* 📦\n\nHalo Bpk/Ibu *${supplier.name || supplier.businessName || 'Supplier'}*,\n` +
            `Status pengiriman pesanan *${id}* telah diperbarui menjadi *DIKIRIM*.\n\n` +
            `• Kurir: *${existingOrder.courier}*\n` +
            `• Barang: *${itemsDescription}*\n\n` +
            `Semoga perjalanan lancar dan cepat sampai di tangan pembeli! 🤝`;
        } else if (upperStatus === 'SELESAI') {
          const commodityTotal = existingOrder.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
          msg = `💰 *TUMBASNA ESCROW CAIR* 🎉\n\nHalo Bpk/Ibu *${supplier.name || supplier.businessName || 'Supplier'}*,\n` +
            `Pembeli telah mengonfirmasi penerimaan barang untuk pesanan *${id}*.\n\n` +
            `Dana Escrow komoditas sebesar *Rp ${commodityTotal.toLocaleString('id-ID')}* telah dilepaskan dan ditambahkan langsung ke Saldo Aktif Anda!\n\n` +
            `💡 Ketik *2* di WhatsApp ini untuk mengecek saldo terkini Juragan. Terima kasih telah bertransaksi dengan jujur! 🌾`;
        } else if (upperStatus === 'DIBATALKAN') {
          msg = `❌ *TUMBASNA PESANAN BATAL*\n\nHalo Bpk/Ibu *${supplier.name || supplier.businessName || 'Supplier'}*,\n` +
            `Pesanan dengan ID *${id}* telah dibatal kan oleh sistem/pembeli.`;
        }

        if (msg) {
          await sendWANotification(supplier.phoneNumber, msg);
        }
      }

      // Kirim notifikasi ke Buyer (Pedagang)
      if (buyer?.phoneNumber) {
        let msg = '';
        if (upperStatus === 'DIPROSES') {
          msg = `🛒 *TUMBASNA PEMBAYARAN SUKSES*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
            `Pembayaran untuk pesanan *${id}* (*${itemsDescription}*) sebesar *Rp ${formattedTotal}* telah sukses diverifikasi.\n\n` +
            `Saat ini supplier sedang menyiapkan komoditas Anda. Kami akan memberi tahu Anda begitu barang diserahkan ke kurir! 📦`;
        } else if (upperStatus === 'DIKIRIM') {
          msg = `🚚 *TUMBASNA PESANAN DIJALAN*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
            `Kabar baik! Pesanan *${id}* Anda telah diserahkan ke kurir *${existingOrder.courier}* dan sedang dalam perjalanan.\n\n` +
            `Mohon klik tombol *Konfirmasi Terima* di aplikasi Tumbasna begitu barang sampai di pasar Juragan untuk melepas dana escrow ke petani. 🤝`;
        } else if (upperStatus === 'SELESAI') {
          msg = `🤝 *TUMBASNA TRANSAKSI SELESAI*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
            `Terima kasih telah mengonfirmasi penerimaan pesanan *${id}*.\n\n` +
            `Transaksi selesai secara aman. Dana pembayaran Anda telah kami teruskan ke rekening petani/supplier. Semoga dagangan Juragan laris manis! 🌾`;
        } else if (upperStatus === 'DIBATALKAN') {
          msg = `❌ *TUMBASNA PESANAN BATAL*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
            `Pesanan *${id}* telah dibatalkan. Jika pembayaran telah terpotong, dana akan dikembalikan penuh (refund) ke saldo/rekening Anda.`;
        }

        if (msg) {
          await sendWANotification(buyer.phoneNumber, msg);
        }
      }
    } catch (notiErr: any) {
      console.error('⚠️ Gagal mengirim notifikasi status ke WA:', notiErr.message);
    }

    // 5. Auto-manage DeliveryGroup berdasarkan perubahan status
    try {
      const buyerForGroup = existingOrder.buyerUserId
        ? await prisma.user.findUnique({ where: { id: existingOrder.buyerUserId } })
        : null;
      const buyerDisplayName =
        buyerForGroup?.businessName || buyerForGroup?.name || 'Pembeli';

      if (upperStatus === 'DIKIRIM') {
        const existingGroup = await prisma.deliveryGroup.findUnique({
          where: { orderId: id },
        });
        if (!existingGroup) {
          const driverAccessToken = crypto.randomUUID();
          await prisma.deliveryGroup.create({
            data: {
              orderId: id,
              status: 'ACTIVE',
              driverAccessToken,
              messages: {
                create: {
                  senderRole: 'system',
                  senderName: 'Tumbasna',
                  text:
                    `Pesanan *${id}* sedang dalam perjalanan.\n\n` +
                    `• Supplier: ${existingOrder.supplierName}\n` +
                    `• Pembeli: ${buyerDisplayName}\n` +
                    `• Kurir: ${existingOrder.courier}\n\n` +
                    `Gunakan chat ini untuk koordinasi pengiriman. Supplier dan Pembeli bisa saling berkomunikasi di sini.`,
                  isSystemMessage: true,
                },
              },
            },
          });
          console.log(`[DELIVERY GROUP] Grup chat dibuat untuk order ${id}`);
        }
      } else if (upperStatus === 'SELESAI' || upperStatus === 'DIBATALKAN') {
        const groupToClose = await prisma.deliveryGroup.findUnique({
          where: { orderId: id },
        });
        if (groupToClose && groupToClose.status === 'ACTIVE') {
          await prisma.deliveryGroup.update({
            where: { orderId: id },
            data: { status: 'CLOSED' },
          });
          await prisma.deliveryGroupMessage.create({
            data: {
              groupId: groupToClose.id,
              senderRole: 'system',
              senderName: 'Tumbasna',
              text:
                upperStatus === 'SELESAI'
                  ? 'Pesanan telah dikonfirmasi selesai. Chat pengiriman ini ditutup. Terima kasih!'
                  : 'Pesanan dibatalkan. Chat pengiriman ini ditutup.',
              isSystemMessage: true,
            },
          });
          console.log(`[DELIVERY GROUP] Grup chat ditutup untuk order ${id} (status: ${upperStatus})`);
        }
      }
    } catch (groupErr: any) {
      console.warn('⚠️ [DELIVERY GROUP] Gagal auto-manage grup:', groupErr.message);
    }

    return NextResponse.json({ success: true, data: updatedOrder });

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
