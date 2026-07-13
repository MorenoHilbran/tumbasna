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

// POST /api/auth/login
// Body: { phone } atau { email } — mobile login pakai nomor HP atau email Google
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json({ error: 'Nomor HP atau Email wajib diisi' }, { status: 400 });
    }

    // Cari user berdasarkan phone atau email
    const include = {
      orders: {
        where: { status: { notIn: ['SELESAI', 'DIBATALKAN'] as any } },
        select: { id: true },
      },
    };

    let user;
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      user = await prisma.user.findUnique({ where: { phoneNumber: normalizedPhone }, include });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include });
    }

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
