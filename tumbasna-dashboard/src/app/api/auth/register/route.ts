import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/register
// Body: { ownerName, businessName, phone, email, address, businessType, bankName, bankAccount }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, businessName, phone, email, address, businessType, bankName, bankAccount } = body;

    if (!ownerName || !phone) {
      return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 });
    }

    // Normalize phone: hilangkan +62 / 62, pastikan format 62xxx
    const normalizedPhone = phone.replace(/^\+/, '').replace(/^0/, '62');

    // Cek apakah nomor sudah terdaftar
    const existing = await prisma.user.findUnique({ where: { phoneNumber: normalizedPhone } });
    if (existing) {
      if (existing.name) {
        return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 409 });
      }
      
      // Jika nomor sudah terbuat (misal via supply input) tapi nama masih kosong, kita lengkapi profilnya
      const updatedUser = await prisma.user.update({
        where: { phoneNumber: normalizedPhone },
        data: {
          name: ownerName,
          email: email || null,
          role: body.role || 'PEDAGANG',
          address: address || null,
          businessName: businessName || null,
          businessType: businessType || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          address: updatedUser.address,
          businessName: updatedUser.businessName,
          businessType: updatedUser.businessType,
          bankName: updatedUser.bankName,
          bankAccount: updatedUser.bankAccount,
          balance: Number(updatedUser.balance),
        }
      }, { status: 200 });
    }

    // Buat user baru dengan role dari body (default: PEDAGANG)
    const user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        name: ownerName,
        email: email || null,
        role: body.role || 'PEDAGANG',
        address: address || null,
        businessName: businessName || null,
        businessType: businessType || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        balance: 0,
      },
    });

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
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API REGISTER ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
