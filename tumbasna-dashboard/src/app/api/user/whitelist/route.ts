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
                businessType: true
            }
        });

        if (user) {
            return NextResponse.json({ 
                success: true, 
                isWhitelisted: true, 
                isRegistered: !!user.name,
                name: user.name,
                balance: Number(user.balance),
                role: user.role,
                bankName: user.bankName,
                bankAccount: user.bankAccount,
                address: user.address,
                businessName: user.businessName,
                businessType: user.businessType
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
