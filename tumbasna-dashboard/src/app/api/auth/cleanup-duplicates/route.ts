import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ── Normalisasi nomor HP ke format 62xxx ─────────────────────────────────────
function normalizePhone(raw: string): string {
  let p = (raw || '').trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (p.startsWith('+62')) p = '62' + p.slice(3);
  else if (p.startsWith('62')) { /* sudah benar */ }
  else if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8')) p = '62' + p;
  return p;
}

/**
 * GET /api/auth/cleanup-duplicates
 * 
 * Endpoint satu kali pakai untuk:
 * 1. Mendeteksi user dengan nomor HP yang secara logis sama tapi berbeda format di DB
 * 2. Menghapus user duplikat yang tidak memiliki nama (data tidak lengkap)
 * 3. Menormalkan ulang nomor HP semua user ke format 62xxx
 * 
 * AMAN: Tidak menghapus user yang memiliki nama, pesanan, atau saldo.
 */
export async function GET() {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        balance: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const report: Record<string, string[]> = {};
    const toDelete: string[] = [];
    const toNormalize: { id: string; oldPhone: string; newPhone: string }[] = [];

    // Kelompokkan user berdasarkan nomor yang sudah dinormalisasi
    const grouped: Record<string, typeof allUsers> = {};
    for (const u of allUsers) {
      const normalized = normalizePhone(u.phoneNumber);
      if (!grouped[normalized]) grouped[normalized] = [];
      grouped[normalized].push(u);
    }

    // Proses setiap grup
    for (const [normalizedPhone, users] of Object.entries(grouped)) {
      // Tandai nomor yang perlu dinormalisasi
      for (const u of users) {
        if (u.phoneNumber !== normalizedPhone) {
          toNormalize.push({ id: u.id, oldPhone: u.phoneNumber, newPhone: normalizedPhone });
        }
      }

      // Jika ada lebih dari 1 user dengan nomor yang sama setelah normalisasi
      if (users.length > 1) {
        report[normalizedPhone] = users.map(u => `${u.id} (nama: ${u.name || 'kosong'}, orders: ${u._count.orders}, saldo: ${u.balance})`);

        // Tandai duplikat yang aman dihapus: tidak punya nama, tidak punya pesanan, tidak punya saldo
        const safeDuplicates = users.filter(
          u => !u.name && u._count.orders === 0 && Number(u.balance) === 0
        );

        // Sisakan satu user (yang paling lengkap), hapus sisanya
        const keepUser = users.find(u => u.name) || users[0];
        for (const u of safeDuplicates) {
          if (u.id !== keepUser.id) {
            toDelete.push(u.id);
          }
        }
      }
    }

    // Jalankan normalisasi nomor (update satu per satu untuk menghindari conflict unique)
    let normalizedCount = 0;
    for (const item of toNormalize) {
      try {
        // Cek apakah nomor baru sudah dipakai user lain
        const conflict = await prisma.user.findUnique({ where: { phoneNumber: item.newPhone } });
        if (!conflict || conflict.id === item.id) {
          await prisma.user.update({
            where: { id: item.id },
            data: { phoneNumber: item.newPhone },
          });
          normalizedCount++;
        }
      } catch (e) {
        console.warn(`[CLEANUP] Gagal normalisasi ${item.id}:`, e);
      }
    }

    // Hapus duplikat yang aman
    let deletedCount = 0;
    if (toDelete.length > 0) {
      const deleteResult = await prisma.user.deleteMany({
        where: { id: { in: toDelete } },
      });
      deletedCount = deleteResult.count;
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: allUsers.length,
        duplicateGroups: Object.keys(report).length,
        normalizedPhoneNumbers: normalizedCount,
        deletedDuplicates: deletedCount,
        remainingAfterCleanup: allUsers.length - deletedCount,
      },
      duplicatesFound: report,
      deletedIds: toDelete,
      message: deletedCount === 0 && normalizedCount === 0
        ? 'Tidak ada duplikat atau nomor tidak valid ditemukan. Database sudah bersih!'
        : `Berhasil: ${normalizedCount} nomor dinormalisasi, ${deletedCount} duplikat dihapus.`,
    });
  } catch (error: any) {
    console.error('[CLEANUP DUPLICATES ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
