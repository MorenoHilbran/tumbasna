import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';

const WA_BOT_URL = process.env.WA_BOT_URL || 'http://127.0.0.1:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, status, notes } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: 'userId dan status wajib diisi' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'status harus APPROVED atau REJECTED' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: status
      } as any
    });

    // Kirim notifikasi WA secara asinkron ke supplier via tumbasna-whatsapp
    const botUrls = Array.from(new Set([
      process.env.WA_BOT_URL,
      'http://whatsapp-bot:3002',
      'http://127.0.0.1:3002',
      'http://localhost:3002',
      'http://127.0.0.1:3001'
    ].filter(Boolean))) as string[];

    let sentNotification = false;
    for (const botUrl of botUrls) {
      try {
        await axios.post(`${botUrl}/api/notify-verification`, {
          phone: user.phoneNumber,
          status: status,
          name: user.name || user.businessName || 'Supplier',
          notes: notes || ''
        }, { timeout: 4000 });
        console.log(`[VERIFY SUPPLIER] Notifikasi WA terkirim via ${botUrl} ke ${user.phoneNumber} (${status})`);
        sentNotification = true;
        break;
      } catch (waErr: any) {
        console.warn(`[VERIFY SUPPLIER WARN] Gagal via ${botUrl}:`, waErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status verifikasi supplier berhasil diubah menjadi ${status}`,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        businessName: updatedUser.businessName,
        phoneNumber: updatedUser.phoneNumber,
        verificationStatus: (updatedUser as any).verificationStatus
      }
    });

  } catch (error: any) {
    console.error('[API VERIFY SUPPLIER ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
