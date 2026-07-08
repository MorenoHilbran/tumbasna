import prisma from '../lib/prisma';

async function main() {
  console.log("Fetching all orders from DB...");
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          productEntry: {
            include: { user: true },
          },
        },
      },
    },
  });

  console.log(`Found ${orders.length} orders. Testing mapping...`);
  
  for (const order of orders) {
    try {
      const mappedItems = order.items.map((item) => {
        if (!item.commodity) {
          throw new Error(`Item ID ${item.id} has null/empty commodity!`);
        }
        return {
          quantity: Number(item.qty),
          product: {
            id: item.productEntryId || item.id,
            name: item.commodity
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
            price: Number(item.price),
            stock: 0,
            supplierName: item.supplierName,
            supplierLocation: order.supplierLocation,
            supplierRating: 4.8,
            image: '/image/produk/' + item.commodity.replace(/\s+/g, '').toLowerCase() + '.png',
            description: `Komoditas ${item.commodity} dari ${order.supplierLocation}.`,
            shippingEstimate: '1-3 Hari',
            category: item.commodity,
            priceHistory: [],
          },
        };
      });
      
      const mappedOrder = {
        id: order.id,
        supplierName: order.supplierName,
        supplierLocation: order.supplierLocation,
        courier: order.courier,
        shippingCost: Number(order.shippingCost),
        totalAmount: Number(order.totalAmount),
        date: new Date(order.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: order.status,
        paymentQrCode: order.paymentQrCode || '',
        fundsReleased: order.fundsReleased,
        notes: order.notes || '',
        trackingTimeline: order.trackingTimeline,
        paymentCountdown: 0,
        items: mappedItems,
      };
      
      console.log(`Order ${order.id} mapped successfully.`);
    } catch (err: any) {
      console.error(`❌ Error mapping order ${order.id}:`, err.message);
    }
  }
  
  console.log("Mapping test complete.");
}

main().catch(console.error);
