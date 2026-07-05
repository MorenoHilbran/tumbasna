import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. KPI Counts
    const totalTransactions = await prisma.order.count();
    const orderSum = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
    });
    const totalValue = orderSum._sum.totalAmount ? Number(orderSum._sum.totalAmount) : 0;

    const totalSuppliers = await prisma.user.count({
      where: { role: 'PETANI' },
    });
    const totalBuyers = await prisma.user.count({
      where: { role: 'PEDAGANG' },
    });
    const activeCommodities = await prisma.productEntry.count({
      where: { status: 'ACTIVE', type: 'SUPPLY' },
    });

    // 2. Recent Activities (from last 5 Orders)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: true,
      },
    });

    const recentActivities = recentOrders.map((o) => {
      const timeDiff = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
      let timeText = `${timeDiff} menit lalu`;
      if (timeDiff >= 1440) {
        timeText = `${Math.round(timeDiff / 1440)} hari lalu`;
      } else if (timeDiff >= 60) {
        timeText = `${Math.round(timeDiff / 60)} jam lalu`;
      }

      let statusText = 'proses';
      if (o.status === 'SELESAI') statusText = 'selesai';
      if (o.status === 'DIBATALKAN') statusText = 'batal';
      if (o.status === 'DIKIRIM') statusText = 'jalan';

      return {
        id: o.id,
        type: 'transaksi',
        title: `Transaksi Komoditas`,
        from: o.supplierName || 'Supplier',
        to: o.buyer?.name || 'Buyer',
        time: timeText,
        status: statusText,
        amount: `Rp ${Number(o.totalAmount).toLocaleString('id-ID')}`,
      };
    });

    // 3. Top Commodities (aggregated from Supply Product Entries)
    const commodityGroup = await prisma.productEntry.groupBy({
      by: ['commodity'],
      _count: {
        id: true,
      },
      where: {
        type: 'SUPPLY',
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 6,
    });

    const totalActiveProducts = await prisma.productEntry.count({
      where: { type: 'SUPPLY' },
    });

    const topCommodities = commodityGroup.map((c) => {
      const count = c._count.id;
      const pct = totalActiveProducts > 0 ? Math.round((count / totalActiveProducts) * 100) : 0;
      return {
        name: c.commodity,
        value: count,
        pct,
        color: '#059669', // Emerald
      };
    });

    // 4. Daily Transactions (Count of orders grouped by day of week)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
        },
      },
      select: {
        createdAt: true,
      },
    });

    const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach((o) => {
      const dayIndex = new Date(o.createdAt).getDay();
      dailyCounts[dayIndex]++;
    });

    // reorder to start from Monday (Senin) to Sunday (Minggu)
    const dailyTransactions = [
      { day: 'Sen', value: dailyCounts[1], label: 'Senin' },
      { day: 'Sel', value: dailyCounts[2], label: 'Selasa' },
      { day: 'Rab', value: dailyCounts[3], label: 'Rabu' },
      { day: 'Kam', value: dailyCounts[4], label: 'Kamis' },
      { day: 'Jum', value: dailyCounts[5], label: 'Jumat' },
      { day: 'Sab', value: dailyCounts[6], label: 'Sabtu' },
      { day: 'Min', value: dailyCounts[0], label: 'Minggu' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalTransactions,
          totalValue,
          totalSuppliers,
          totalBuyers,
          activeCommodities,
        },
        recentActivities,
        topCommodities,
        dailyTransactions,
      },
    });
  } catch (error: any) {
    console.error('[API DASHBOARD STATS ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
