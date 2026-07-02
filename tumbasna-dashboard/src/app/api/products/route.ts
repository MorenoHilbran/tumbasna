import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const supplyEntries = await prisma.productEntry.findMany({
      where: { type: 'SUPPLY', status: 'ACTIVE' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const products = supplyEntries.map(entry => {
      // Map database schema to mobile app Product interface
      return {
        id: entry.id,
        name: entry.commodity.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        price: entry.price,
        stock: entry.qty,
        supplierName: entry.user.name || 'Petani ' + entry.user.phoneNumber,
        supplierLocation: entry.location,
        supplierRating: 4.8, // Mocked rating for now
        image: '/image/produk/' + entry.commodity.replace(/\s+/g, '').toLowerCase() + '.png', // Simple image mapping
        description: `Komoditas ${entry.commodity} segar dari ${entry.location}. Kualitas terjamin.`,
        shippingEstimate: '1-3 Hari',
        category: entry.commodity,
        priceHistory: [
          { month: 'Jan', price: entry.price * 0.9 },
          { month: 'Feb', price: entry.price * 0.95 },
          { month: 'Mar', price: entry.price },
          { month: 'Apr', price: entry.price * 1.05 },
          { month: 'Mei', price: entry.price * 0.98 },
          { month: 'Jun', price: entry.price }
        ]
      };
    });

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
