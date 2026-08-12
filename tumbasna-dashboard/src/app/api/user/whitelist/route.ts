import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
        }

        // Buat variasi nomor HP (628... vs 08...)
        let altPhone = phone;
        if (phone.startsWith('62')) {
            altPhone = '0' + phone.substring(2);
        } else if (phone.startsWith('0')) {
            altPhone = '62' + phone.substring(1);
        } else if (phone.startsWith('+62')) {
            altPhone = '0' + phone.substring(3);
        }

        // 1. Cek apakah ada di tabel User (dengan format 62 atau 08)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: altPhone },
                    { phoneNumber: phone.replace('+', '') }
                ]
            },
            select: { 
                id: true, 
                name: true, 
                balance: true, 
                role: true,
                bankName: true,
                bankAccount: true,
                address: true,
                businessName: true,
                businessType: true,
                nibUrl: true,
                verificationStatus: true
            }
        });

        if (user) {
            let currentBalance = Number(user.balance);

            // Auto-sync saldo untuk supplier jika ada pesanan SELESAI / Dana Dicaikan yang belum masuk ke balance
            if (user.role === 'PETANI') {
              try {
                const uName = (user.name || '').toLowerCase();
                const bName = (user.businessName || '').toLowerCase();

                const completedOrders = await prisma.order.findMany({
                  where: {
                    OR: [
                      { status: 'SELESAI' },
                      { fundsReleased: true }
                    ]
                  },
                  include: { items: true }
                });

                let totalEarned = 0;
                for (const ord of completedOrders) {
                  const sName = (ord.supplierName || '').toLowerCase();
                  const isMatch =
                    (uName && (sName.includes(uName) || uName.includes(sName))) ||
                    (bName && (sName.includes(bName) || bName.includes(sName)));

                  if (isMatch) {
                    const commTotal = ord.items.reduce(
                      (sum: number, item: any) => sum + Number(item.price) * Number(item.qty),
                      0
                    );
                    const amt = commTotal > 0 ? commTotal : Number(ord.totalAmount);
                    totalEarned += amt;
                  }
                }

                if (totalEarned > currentBalance) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { balance: totalEarned }
                  });
                  currentBalance = totalEarned;
                  console.log(`🔄 [BALANCE AUTO-SYNC] Updated balance for ${user.name} (+${phone}) to Rp ${totalEarned}`);
                }
              } catch (syncErr: any) {
                console.warn(`⚠️ [BALANCE AUTO-SYNC WARN]`, syncErr.message);
              }
            }

            return NextResponse.json({ 
                success: true, 
                isWhitelisted: true, 
                isRegistered: !!(user.name || user.businessName),
                name: user.name || user.businessName || '',
                balance: currentBalance,
                role: user.role,
                bankName: user.bankName,
                bankAccount: user.bankAccount,
                address: user.address,
                businessName: user.businessName,
                businessType: user.businessType,
                nibUrl: user.nibUrl || null,
                verificationStatus: user.verificationStatus || 'APPROVED'
            });
        }

        // 2. Jika tidak ada di User, cek di tabel ChatSession (Untuk akun sekunder / admin)
        const session = await prisma.chatSession.findFirst({
             where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: altPhone },
                    { phoneNumber: phone.replace('+', '') }
                ]
            },
            select: { isWhitelisted: true }
        });

        return NextResponse.json({
            success: true,
            isWhitelisted: !!session?.isWhitelisted
        });

    } catch (error) {
        console.error("Gagal check whitelist user:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
