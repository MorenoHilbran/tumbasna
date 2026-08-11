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

// POST /api/users/delete
// Body: { phone: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Nomor HP wajib diisi' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // 1. Cari pengguna di database
    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
      include: {
        productEntries: true,
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan di sistem' }, { status: 404 });
    }

    // 2. Proteksi Keamanan 1: Cek Saldo Aktif
    const userBalance = Number(user.balance || 0);
    if (userBalance > 0) {
      return NextResponse.json({
        success: false,
        error: `Akun tidak dapat dihapus karena masih memiliki Saldo Aktif sebesar Rp ${userBalance.toLocaleString('id-ID')}. Harap cairkan saldo Anda terlebih dahulu.`
      }, { status: 400 });
    }

    // 3. Proteksi Keamanan 2: Cek Pesanan Pembeli yang Masih Berjalan
    const activeBuyerOrders = await prisma.order.findMany({
      where: {
        buyerUserId: user.id,
        status: {
          in: ['MENUNGGU_PEMBAYARAN', 'DIPROSES', 'DIKIRIM']
        }
      }
    });

    if (activeBuyerOrders.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Akun tidak dapat dihapus karena Anda masih memiliki ${activeBuyerOrders.length} pesanan aktif yang sedang berjalan.`
      }, { status: 400 });
    }

    // 4. Proteksi Keamanan 3: Cek Pesanan Supplier yang Masih Berjalan
    const userBusinessNames = [user.name, user.businessName].filter(Boolean) as string[];
    if (userBusinessNames.length > 0) {
      const activeSupplierOrders = await prisma.order.findMany({
        where: {
          supplierName: {
            in: userBusinessNames,
            mode: 'insensitive'
          },
          status: {
            in: ['MENUNGGU_PEMBAYARAN', 'DIPROSES', 'DIKIRIM']
          }
        }
      });

      if (activeSupplierOrders.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Akun tidak dapat dihapus karena toko/usaha Anda masih memiliki ${activeSupplierOrders.length} pesanan masuk yang sedang diproses.`
        }, { status: 400 });
      }
    }

    // 5. Eksekusi Hapus Data
    // A. Hapus ChatSession jika ada
    await prisma.chatSession.deleteMany({
      where: { phoneNumber: normalizedPhone }
    });

    // B. Hapus User (ProductEntries terhapus otomatis via Cascade)
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log(`[DELETE USER SUCCESS] User +${normalizedPhone} (${user.name}) berhasil dihapus beserta data produk & histori chat.`);

    return NextResponse.json({
      success: true,
      message: 'Akun dan seluruh data pengguna berhasil dihapus dari sistem.'
    });

  } catch (error: any) {
    console.error(`[DELETE USER ERROR]:`, error);
    return NextResponse.json({
      success: false,
      error: `Gagal menghapus akun: ${error.message}`
    }, { status: 500 });
  }
}
