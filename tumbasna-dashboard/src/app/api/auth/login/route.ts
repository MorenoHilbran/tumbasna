import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/login
// Body: { phone }  — mobile login pakai nomor HP (no password system)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Nomor HP wajib diisi' }, { status: 400 });
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/^\+/, '').replace(/^0/, '62');

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
      include: {
        orders: {
          where: { status: { notIn: ['SELESAI', 'DIBATALKAN'] } },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        businessName: user.businessName,
        businessType: user.businessType,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        balance: Number(user.balance),
        activeOrdersCount: user.orders.length,
      },
    });

  } catch (error: any) {
    console.error('[API LOGIN ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
