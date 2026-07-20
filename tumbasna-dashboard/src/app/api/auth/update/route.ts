import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/update
// Body: { id, name, businessName, email, address, businessType, bankName, bankAccount }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, phone, name, businessName, email, address, businessType, bankName, bankAccount, lat, lng } = body;

    let userId = id;
    if (!userId && phone) {
      const p = normalizePhone(phone);
      const userObj = await prisma.user.findUnique({ where: { phoneNumber: p } });
      if (userObj) userId = userObj.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID atau nomor HP wajib disertakan' }, { status: 400 });
    }

    // Cek apakah user ada
    const userExist = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExist) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Cek duplikasi email jika email diubah
    if (email && email !== userExist.email) {
      const emailDup = await prisma.user.findUnique({ where: { email } });
      if (emailDup) {
        return NextResponse.json({ error: 'Email sudah terdaftar oleh pengguna lain' }, { status: 409 });
      }
    }

    // Update user di database
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        businessName: businessName !== undefined ? businessName : undefined,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        businessType: businessType !== undefined ? businessType : undefined,
        bankName: bankName !== undefined ? bankName : undefined,
        bankAccount: bankAccount !== undefined ? bankAccount : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        phoneNumber: updated.phoneNumber,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        address: updated.address,
        businessName: updated.businessName,
        businessType: updated.businessType,
        bankName: updated.bankName,
        bankAccount: updated.bankAccount,
        balance: Number(updated.balance),
      },
    });
  } catch (error: any) {
    console.error('[API UPDATE USER ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
