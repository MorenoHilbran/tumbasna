import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getProductImage(commodity: string): string {
  const name = commodity.toLowerCase();
  if (name.includes('beras')) return '/image/produk/beras.png';
  if (name.includes('jagung')) return '/image/produk/jagung.png';
  if (name.includes('cabai merah') || name.includes('cabe merah') || name.includes('cabai') || name.includes('cabe')) return '/image/produk/cabaimerah.png';
  if (name.includes('bawang merah') || name.includes('bawangmerah')) return '/image/produk/bawangmerah.png';
  if (name.includes('bawang putih') || name.includes('bawangputih')) return '/image/produk/bawangputih.png';
  if (name.includes('jahe') || name.includes('rempah') || name.includes('kunyit') || name.includes('kencur')) return '/image/produk/jahe.png';
  if (name.includes('tomat')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80';
  if (name.includes('kentang')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80';
  if (name.includes('melon') || name.includes('semangka')) return 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
}

// Helper: Haversine distance calculation
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = searchParams.get('lat');
    const userLng = searchParams.get('lng');
    const maxDistance = parseFloat(searchParams.get('maxDistance') || '100'); // Default 100km

    const supplyEntries = await prisma.productEntry.findMany({
      where: { type: 'SUPPLY', status: 'ACTIVE' },
      include: { 
        user: true,
        orderItems: {
          include: {
            order: {
              select: { status: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Fetch more, filter by distance later
    });

    let products = supplyEntries.map(entry => {
      const priceNum = Number(entry.price);
      const soldQty = entry.orderItems
        .filter(item => item.order && ['DIPROSES', 'DIKIRIM', 'SELESAI'].includes(item.order.status))
        .reduce((sum, item) => sum + Number(item.qty), 0);
      const remainingStock = Math.max(0, Number(entry.qty) - soldQty);

      return {
        id: entry.id,
        name: entry.commodity.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        price: priceNum,
        stock: remainingStock,
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
        image: (() => {
          let img = entry.image;
          if (img && typeof img === 'string') {
            img = img.replace(/^(URL Foto:\s*|url foto:\s*)/i, '').trim();
          }
          return img || getProductImage(entry.commodity);
        })(),
        description: `Komoditas ${entry.commodity} segar dari ${entry.user.businessName || entry.user.name || 'Petani'}. Kualitas terjamin.`,
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

    // Filter by distance if user location is provided
    if (userLat && userLng) {
      const userLatNum = parseFloat(userLat);
      const userLngNum = parseFloat(userLng);

      if (!isNaN(userLatNum) && !isNaN(userLngNum)) {
        products = products.filter(product => {
          if (!product.lat || !product.lng) return true; // Include products even if coordinates are null
          
          const distance = haversineKm(userLatNum, userLngNum, product.lat, product.lng);
          return distance <= maxDistance;
        });

        // Add distance info to each product for client-side display
        products = products.map(product => {
          if (product.lat && product.lng) {
            const distance = haversineKm(userLatNum, userLngNum, product.lat, product.lng);
            return {
              ...product,
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal
              distanceText: distance < 1 ? 'm' : 'km'
            };
          }
          return product;
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        total: products.length,
        filtered: userLat && userLng,
        maxDistance: maxDistance
      }
    });
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
