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
