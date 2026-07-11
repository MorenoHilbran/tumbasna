import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ── Normalisasi nomor HP ke format 62xxx ─────────────────────────────────────
function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (p.startsWith('+62')) p = '62' + p.slice(3);
  else if (p.startsWith('62')) { /* sudah benar */ }
  else if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8')) p = '62' + p; // 812xxx → 6212xxx
  return p;
}

// POST /api/auth/register
// Body: { ownerName, businessName, phone, email, address, businessType, bankName, bankAccount }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerName, businessName, phone, email, address, businessType, bankName, bankAccount } = body;

    if (!ownerName || !phone) {
      return NextResponse.json({ error: 'Nama dan nomor HP wajib diisi' }, { status: 400 });
    }

    // Normalize phone: format seragam 62xxx
    const normalizedPhone = normalizePhone(phone);

    // Cek apakah nama usaha sudah terdaftar oleh pengguna lain
    if (businessName) {
      const existingBusiness = await prisma.user.findFirst({
        where: {
          businessName: {
            equals: businessName.trim(),
            mode: 'insensitive'
          }
        }
      });
      if (existingBusiness && existingBusiness.phoneNumber !== normalizedPhone) {
        return NextResponse.json({ error: `Nama usaha "${businessName}" sudah terdaftar oleh pengguna lain` }, { status: 409 });
      }
    }

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
