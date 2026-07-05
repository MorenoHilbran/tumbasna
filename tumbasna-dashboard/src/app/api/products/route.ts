import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getProductImage(commodity: string): string {
  const name = commodity.toLowerCase();
  if (name.includes('beras')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80';
  if (name.includes('jagung')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d20f6?w=400&q=80';
  if (name.includes('tomat')) return 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80';
  if (name.includes('cabai merah') || name.includes('cabe merah')) return 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=80';
  if (name.includes('cabai rawit') || name.includes('cabe rawit') || name.includes('cabai') || name.includes('cabe')) return 'https://images.unsplash.com/photo-1588252303782-cb80119cb665?w=400&q=80';
  if (name.includes('bawang merah') || name.includes('bawangmerah')) return 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80';
  if (name.includes('bawang putih') || name.includes('bawangputih')) return 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80';
  if (name.includes('kedelai')) return 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80';
  if (name.includes('kentang')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80';
  if (name.includes('minyak')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
}

export async function GET() {
  try {
    const supplyEntries = await prisma.productEntry.findMany({
      where: { type: 'SUPPLY', status: 'ACTIVE' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const products = supplyEntries.map(entry => {
      const priceNum = Number(entry.price);
      // Map database schema to mobile app Product interface
      return {
        id: entry.id,
        name: entry.commodity.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        price: priceNum,
        stock: Number(entry.qty),
        supplierName: entry.user.name || 'Petani ' + entry.user.phoneNumber,
        supplierLocation: entry.location,
        supplierPhone: entry.user.phoneNumber,
        lat: entry.lat,
        lng: entry.lng,
        supplierRating: (() => {
          const str = entry.userId || entry.user.phoneNumber || 'default';
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return 4.5 + (Math.abs(hash) % 6) * 0.1;
        })(),
        image: entry.image || getProductImage(entry.commodity),
        description: `Komoditas ${entry.commodity} segar dari ${entry.location}. Kualitas terjamin.`,
        shippingEstimate: '1-3 Hari',
        category: entry.commodity,
        priceHistory: [
          { month: 'Jan', price: priceNum * 0.9 },
          { month: 'Feb', price: priceNum * 0.95 },
          { month: 'Mar', price: priceNum },
          { month: 'Apr', price: priceNum * 1.05 },
          { month: 'Mei', price: priceNum * 0.98 },
          { month: 'Jun', price: priceNum }
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
