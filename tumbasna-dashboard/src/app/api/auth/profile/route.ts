import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/auth/profile?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: { status: { notIn: ['SELESAI', 'DIBATALKAN'] } },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Hitung pengeluaran bulan ini dari orders SELESAI
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlySpend = await prisma.order.aggregate({
      where: {
        buyerUserId: userId,
        status: 'SELESAI',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { totalAmount: true },
    });

    const purchasesThisMonth = monthlySpend._sum.totalAmount
      ? Number(monthlySpend._sum.totalAmount)
      : 0;

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
        purchasesThisMonth,
      },
    });
  } catch (error: any) {
    console.error('[API GET PROFILE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/auth/profile
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, id, ownerName, name, businessName, email, address, businessType, bankName, bankAccount } = body;
    const targetId = userId || id;

    if (!targetId) {
      return NextResponse.json({ error: 'User ID wajib disertakan' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
      return NextResponse.json({
        success: true,
        message: 'Profil mock berhasil diperbarui',
        data: { id: targetId, ...body }
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(ownerName || name ? { name: ownerName || name } : {}),
        ...(businessName !== undefined ? { businessName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(businessType !== undefined ? { businessType } : {}),
        ...(bankName !== undefined ? { bankName } : {}),
        ...(bankAccount !== undefined ? { bankAccount } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        address: updated.address,
        businessName: updated.businessName,
        businessType: updated.businessType,
        bankName: updated.bankName,
        bankAccount: updated.bankAccount,
      },
    });
  } catch (error: any) {
    console.error('[API PATCH PROFILE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
