import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (p.startsWith('+62')) p = '62' + p.slice(3);
  else if (p.startsWith('62')) { /* sudah benar */ }
  else if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8')) p = '62' + p;
  return p;
}

// POST /api/entries/delete
// Body: { entryId: string, phone: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entryId, phone } = body;

    if (!entryId || !phone) {
      return NextResponse.json({ success: false, error: 'Parameter entryId dan phone wajib diisi' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // 1. Cari user pemilik nomor HP
    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    // 2. Cari product entry
    const entry = await prisma.productEntry.findUnique({
      where: { id: entryId },
      include: {
        orderItems: {
          include: {
            order: {
              select: { status: true, id: true }
            }
          }
        }
      }
    });

    if (!entry) {
      return NextResponse.json({ success: false, error: 'Komoditas/produk tidak ditemukan' }, { status: 404 });
    }

    // 3. Verifikasi kepemilikan
    if (entry.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Anda tidak memiliki hak untuk menghapus produk ini' }, { status: 403 });
    }

    // 4. Proteksi: Cek apakah ada pesanan berjalan untuk produk ini
    const activeOrderItems = entry.orderItems.filter(item =>
      item.order && ['MENUNGGU_PEMBAYARAN', 'MENUNGGU_KONFIRMASI', 'DIPROSES', 'TERKIRIM'].includes(item.order.status)
    );

    if (activeOrderItems.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Produk "${entry.commodity}" tidak dapat dihapus karena masih ada pesanan aktif (${activeOrderItems[0].order.id}) yang sedang diproses.`
      }, { status: 400 });
    }

    // 5. Update status entry menjadi CLOSED (tidak aktif lagi)
    await prisma.productEntry.update({
      where: { id: entryId },
      data: {
        status: 'CLOSED'
      }
    });

    console.log(`[DELETE PRODUCT SUCCESS] ProductEntry ${entryId} (${entry.commodity}) milik +${normalizedPhone} diubah status menjadi CLOSED.`);

    return NextResponse.json({
      success: true,
      message: `Listing komoditas ${entry.commodity} berhasil dihapus/dibatalkan.`
    });

  } catch (error: any) {
    console.error(`[DELETE PRODUCT ERROR]:`, error);
    return NextResponse.json({
      success: false,
      error: `Gagal menghapus produk: ${error.message}`
    }, { status: 500 });
  }
}
