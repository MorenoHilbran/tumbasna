import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// Helper untuk kirim notifikasi via WhatsApp bot
async function sendWANotification(phone: string, message: string) {
  const waUrl = process.env.WHATSAPP_BOT_URL || 'http://127.0.0.1:3002';
  const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || 'tumbasna-rahasia-banget';
  try {
    const res = await fetch(`${waUrl}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': waApiKey
      },
      body: JSON.stringify({ phone, message })
    });
    if (res.ok) {
      console.log(`💬 [WA NOTIFICATION] Berhasil kirim ke ${phone}`);
    } else {
      console.warn(`⚠️ [WA NOTIFICATION WARN] status=${res.status} untuk ${phone}`);
    }
  } catch (err: any) {
    console.warn(`❌ [WA NOTIFICATION FAILED] Gagal kirim ke ${phone}:`, err.message);
  }
}

// PATCH /api/orders/[id]  — update status pesanan (bayar, konfirmasi terima)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, trackingTimeline, fundsReleased } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 });
    }

    // 1. Ambil order lama untuk melihat status transisi dan data supplier
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    let shouldReleaseFunds = false;
    // Jika status baru adalah SELESAI, dan order sebelumnya belum SELESAI serta belum dirilis dananya
    if (status === 'SELESAI' && existingOrder.status !== 'SELESAI' && !existingOrder.fundsReleased) {
      shouldReleaseFunds = true;
    }

    // 2. Lakukan update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingTimeline !== undefined && { trackingTimeline }),
        fundsReleased: shouldReleaseFunds ? true : (fundsReleased !== undefined ? fundsReleased : existingOrder.fundsReleased),
      },
    });

    // 3. Jika perlu merilis dana ke saldo supplier (Escrow Release)
    let supplierUser: any = null;
    if (shouldReleaseFunds) {
      // Hitung total dana komoditas (sum of price * qty)
      const commodityTotal = existingOrder.items.reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.qty);
      }, 0);

      // Cari supplier berdasarkan nama/nama usaha
      supplierUser = await prisma.user.findFirst({
        where: {
          OR: [
            { name: existingOrder.supplierName },
            { businessName: existingOrder.supplierName }
          ]
        }
      });

      if (supplierUser) {
        await prisma.user.update({
          where: { id: supplierUser.id },
          data: {
            balance: {
              increment: commodityTotal
            }
          }
        });
        console.log(`💰 [ESCROW RELEASE] Berhasil mencairkan dana Rp ${commodityTotal.toLocaleString('id-ID')} ke saldo supplier ${supplierUser.name} untuk order ${id}`);
      } else {
        console.warn(`⚠️ [ESCROW RELEASE] Gagal menemukan supplier dengan nama "${existingOrder.supplierName}" untuk mencairkan dana order ${id}`);
      }
    }

    // 4. Kirim Notifikasi WhatsApp Otomatis jika terjadi perubahan status
    if (status !== existingOrder.status) {
      try {
        const buyer = existingOrder.buyerUserId ? await prisma.user.findUnique({
          where: { id: existingOrder.buyerUserId }
        }) : null;

        // Cari supplier jika belum dicari di atas
        const supplier = supplierUser || await prisma.user.findFirst({
          where: {
            OR: [
              { name: existingOrder.supplierName },
              { businessName: existingOrder.supplierName }
            ]
          }
        });

        const itemsDescription = existingOrder.items.map(it => `${it.commodity.toUpperCase()} (${Number(it.qty)} kg)`).join(', ');
        const formattedTotal = Number(existingOrder.totalAmount).toLocaleString('id-ID');

        // Kirim notifikasi ke Supplier (Petani)
        if (supplier?.phoneNumber) {
          let msg = '';
          if (status === 'DIPROSES') {
            msg = `📢 *TUMBASNA NOTIFIKASI PESANAN* 🌾\n\nHalo Bpk/Ibu *${supplier.name}*,\n` +
              `Pesanan dengan ID *${id}* telah dibayar oleh pembeli!\n\n` +
              `• Komoditas: *${itemsDescription}*\n` +
              `• Kurir Pilihan: *${existingOrder.courier}*\n` +
              `• Total Transaksi: *Rp ${formattedTotal}*\n\n` +
              `Silakan siapkan barang dengan kualitas terbaik dan segera kirimkan ke kurir pilihan. Terima kasih! 📦`;
          } else if (status === 'DIKIRIM') {
            msg = `🚚 *TUMBASNA PENGIRIMAN AKTIF*\n\nHalo Bpk/Ibu *${supplier.name}*,\n` +
              `Status pesanan *${id}* telah diperbarui menjadi *DIKIRIM*.\n\n` +
              `• Kurir: *${existingOrder.courier}*\n` +
              `• Barang: *${itemsDescription}*\n\n` +
              `Semoga perjalanan lancar dan cepat sampai di tangan pembeli! 🤝`;
          } else if (status === 'SELESAI') {
            const commodityTotal = existingOrder.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
            msg = `💰 *TUMBASNA ESCROW CAIR* 🎉\n\nHalo Bpk/Ibu *${supplier.name}*,\n` +
              `Pembeli telah mengonfirmasi penerimaan barang untuk pesanan *${id}*.\n\n` +
              `Dana Escrow komoditas sebesar *Rp ${commodityTotal.toLocaleString('id-ID')}* telah dilepaskan dan ditambahkan langsung ke Saldo Aktif Anda!\n\n` +
              `💡 Ketik *2* di WhatsApp ini untuk mengecek saldo terkini Juragan. Terima kasih telah bertransaksi dengan jujur! 🌾`;
          } else if (status === 'DIBATALKAN') {
            msg = `❌ *TUMBASNA PESANAN BATAL*\n\nHalo Bpk/Ibu *${supplier.name}*,\n` +
              `Pesanan dengan ID *${id}* telah dibatalkan oleh sistem/pembeli.`;
          }

          if (msg) {
            sendWANotification(supplier.phoneNumber, msg);
          }
        }

        // Kirim notifikasi ke Buyer (Pedagang)
        if (buyer?.phoneNumber) {
          let msg = '';
          if (status === 'DIPROSES') {
            msg = `🛒 *TUMBASNA PEMBAYARAN SUKSES*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
              `Pembayaran untuk pesanan *${id}* (*${itemsDescription}*) sebesar *Rp ${formattedTotal}* telah sukses diverifikasi.\n\n` +
              `Saat ini supplier sedang menyiapkan komoditas Anda. Kami akan memberi tahu Anda begitu barang diserahkan ke kurir! 📦`;
          } else if (status === 'DIKIRIM') {
            msg = `🚚 *TUMBASNA PESANAN DIJALAN*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
              `Kabar baik! Pesanan *${id}* Anda telah diserahkan ke kurir *${existingOrder.courier}* dan sedang dalam perjalanan.\n\n` +
              `Mohon klik tombol *Konfirmasi Terima* di aplikasi Tumbasna begitu barang sampai di pasar Juragan untuk melepas dana escrow ke petani. 🤝`;
          } else if (status === 'SELESAI') {
            msg = `🤝 *TUMBASNA TRANSAKSI SELESAI*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
              `Terima kasih telah mengonfirmasi penerimaan pesanan *${id}*.\n\n` +
              `Transaksi selesai secara aman. Dana pembayaran Anda telah kami teruskan ke rekening petani/supplier. Semoga dagangan Juragan laris manis! 🌾`;
          } else if (status === 'DIBATALKAN') {
            msg = `❌ *TUMBASNA PESANAN BATAL*\n\nHalo Bpk/Ibu *${buyer.name || 'Pedagang'}*,\n` +
              `Pesanan *${id}* telah dibatalkan. Jika pembayaran telah terpotong, dana akan dikembalikan penuh (refund) ke saldo/rekening Anda.`;
          }

          if (msg) {
            sendWANotification(buyer.phoneNumber, msg);
          }
        }
      } catch (notiErr: any) {
        console.error('⚠️ Gagal mengirim notifikasi status ke WA:', notiErr.message);
      }
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
