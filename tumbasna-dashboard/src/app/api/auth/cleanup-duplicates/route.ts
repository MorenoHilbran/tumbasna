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
 * Endpoint untuk membersihkan & menggabungkan (merge) akun duplikat:
 * 1. Mendeteksi user dengan nomor HP serupa tapi berbeda format.
 * 2. Memilih 1 User Utama (Primary) untuk dipertahankan.
 * 3. Memindahkan seluruh relasi data (orders, product entries, chats) dari user duplikat ke User Utama.
 * 4. Menghapus user duplikat setelah datanya aman dimigrasikan.
 * 5. Menormalkan nomor HP User Utama ke format '62xxx'.
 */
export async function GET() {
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            productEntries: true,
            chatMessages: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    // Kelompokkan user berdasarkan nomor HP yang sudah dinormalisasi
    const groups: Record<string, typeof allUsers> = {};
    for (const u of allUsers) {
      const normalized = normalizePhone(u.phoneNumber);
      if (!groups[normalized]) {
        groups[normalized] = [];
      }
      groups[normalized].push(u);
    }

    const mergeLogs: string[] = [];
    let totalMergedCount = 0;
    let normalizedCount = 0;

    // Lakukan pembersihan untuk setiap grup nomor HP
    for (const [normalizedPhone, users] of Object.entries(groups)) {
      // Jika ada duplikasi akun
      if (users.length > 1) {
        // Tentukan Primary User (Prioritas: yang punya pesanan, saldo, atau yang format nomornya sudah benar)
        const sorted = [...users].sort((a, b) => {
          const scoreA = (a._count.orders * 10) + (a._count.productEntries * 5) + Number(a.balance) + (a.phoneNumber === normalizedPhone ? 2 : 0);
          const scoreB = (b._count.orders * 10) + (b._count.productEntries * 5) + Number(b.balance) + (b.phoneNumber === normalizedPhone ? 2 : 0);
          return scoreB - scoreA; // Urutkan dari skor tertinggi
        });

        const primaryUser = sorted[0];
        const duplicateUsers = sorted.slice(1);

        mergeLogs.push(`Merging group [${normalizedPhone}]: Primary is ${primaryUser.name || 'No Name'} (${primaryUser.id})`);

        for (const duplicate of duplicateUsers) {
          // 1. Pindahkan Orders
          if (duplicate._count.orders > 0) {
            await prisma.order.updateMany({
              where: { buyerUserId: duplicate.id },
              data: { buyerUserId: primaryUser.id },
            });
            mergeLogs.push(`  -> Moved ${duplicate._count.orders} orders from ${duplicate.id} to ${primaryUser.id}`);
          }

          // 2. Pindahkan Product Entries
          if (duplicate._count.productEntries > 0) {
            await prisma.productEntry.updateMany({
              where: { userId: duplicate.id },
              data: { userId: primaryUser.id },
            });
            mergeLogs.push(`  -> Moved ${duplicate._count.productEntries} product entries from ${duplicate.id} to ${primaryUser.id}`);
          }

          // 3. Pindahkan Chat Messages
          if (duplicate._count.chatMessages > 0) {
            await prisma.chatMessage.updateMany({
              where: { buyerUserId: duplicate.id },
              data: { buyerUserId: primaryUser.id },
            });
            mergeLogs.push(`  -> Moved ${duplicate._count.chatMessages} chats from ${duplicate.id} to ${primaryUser.id}`);
          }

          // 4. Gabungkan saldo jika ada
          if (Number(duplicate.balance) > 0) {
            await prisma.user.update({
              where: { id: primaryUser.id },
              data: { balance: { increment: duplicate.balance } },
            });
            mergeLogs.push(`  -> Merged balance ${duplicate.balance} from ${duplicate.id} to ${primaryUser.id}`);
          }

          // 5. Hapus akun duplikat
          await prisma.user.delete({
            where: { id: duplicate.id },
          });
          mergeLogs.push(`  -> Deleted duplicate user: ${duplicate.name || 'No Name'} (${duplicate.id})`);
          totalMergedCount++;
        }

        // Pastikan nomor HP primary user menggunakan format normalized
        if (primaryUser.phoneNumber !== normalizedPhone) {
          await prisma.user.update({
            where: { id: primaryUser.id },
            data: { phoneNumber: normalizedPhone },
          });
          normalizedCount++;
        }
      } else {
        // Jika tidak duplikat tapi nomornya belum dalam format standar (62xxx)
        const singleUser = users[0];
        if (singleUser.phoneNumber !== normalizedPhone) {
          try {
            await prisma.user.update({
              where: { id: singleUser.id },
              data: { phoneNumber: normalizedPhone },
            });
            normalizedCount++;
            mergeLogs.push(`Normalized single user ${singleUser.name || 'No Name'} (${singleUser.id}) to ${normalizedPhone}`);
          } catch (e: any) {
            mergeLogs.push(`Failed to normalize ${singleUser.id}: ${e.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalMerged: totalMergedCount,
        normalizedPhoneNumbers: normalizedCount,
        message: `Berhasil menggabungkan ${totalMergedCount} user duplikat dan menormalkan ${normalizedCount} nomor HP.`,
      },
      mergeLogs,
    });
  } catch (error: any) {
    console.error('[CLEANUP MERGE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
  }
}
