import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Search query object
    const searchQuery = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phoneNumber: { contains: search, mode: 'insensitive' as const } },
            { businessName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Fetch all users with counts of their associations
    const users = await prisma.user.findMany({
      where: searchQuery,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            productEntries: true,
            orders: true,
          },
        },
      },
    });

    // Group users by role
    const suppliers = users.filter((u) => u.role === 'PETANI');
    const buyers = users.filter((u) => u.role === 'PEDAGANG');
    const admins = users.filter((u) => u.role === 'ADMIN');

    // Basic summary statistics
    const stats = {
      totalUsers: users.length,
      totalSuppliers: suppliers.length,
      totalBuyers: buyers.length,
      totalAdmins: admins.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        suppliers,
        buyers,
        admins,
        stats,
      },
    });
  } catch (error: any) {
    console.error('[API USERS GET ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // 1. Fetch user to get their phone number
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const phone = user.phoneNumber;

    // 2. Delete User (Prisma Cascade will handle productEntries, matches, and chatMessages)
    await prisma.user.delete({
      where: { id },
    });

    // 3. Delete ChatSession for the real phone number
    try {
      await prisma.chatSession.deleteMany({
        where: { phoneNumber: phone },
      });
    } catch (sessionErr: any) {
      console.warn('[DELETE USER] Warning deleting chat session:', sessionErr.message);
    }

    // 4. Find other sessions (like LID) mapping to this phone number, and delete them
    try {
      const allSessions = await prisma.chatSession.findMany();
      for (const session of allSessions) {
        if (Array.isArray(session.history)) {
          const history = session.history as any[];
          const hasMapping = history.some(
            (item) => item.role === 'metadata' && item.mappedPhone === phone
          );
          if (hasMapping) {
            await prisma.chatSession.delete({
              where: { phoneNumber: session.phoneNumber },
            });
            console.log(`[DELETE USER] Deleted mapped JID session: ${session.phoneNumber}`);
          }
        }
      }
    } catch (mapErr: any) {
      console.warn('[DELETE USER] Warning deleting mapped JID sessions:', mapErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengguna dan seluruh data sesi chat bot berhasil dihapus secara permanen',
    });
  } catch (error: any) {
    console.error('[API USERS DELETE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

