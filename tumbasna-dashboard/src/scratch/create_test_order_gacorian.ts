import prisma from '../lib/prisma';

async function main() {
  const orderId = 'TRX-GACORIAN-TEST';
  
  // Clean up any existing test order
  await prisma.orderItem.deleteMany({
    where: { orderId }
  });
  await prisma.order.deleteMany({
    where: { id: orderId }
  });

  // Create a new order with status DIPROSES for Gacorian
  const order = await prisma.order.create({
    data: {
      id: orderId,
      buyerUserId: null,
      supplierName: 'Gacorian',
      supplierLocation: 'Banyumas',
      courier: 'Kurir Lokal',
      shippingCost: 5000,
      totalAmount: 20000,
      status: 'DIPROSES',
      paymentQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=tumbasna-qris-TRX-GACORIAN-TEST',
      fundsReleased: false,
      trackingTimeline: [
        { title: 'Pembayaran Dikonfirmasi', description: 'Pembayaran QRIS berhasil.', time: '10:00', done: true }
      ],
      items: {
        create: [
          {
            productEntryId: '61545f75-0223-484d-86b8-6a0c6577abd8',
            commodity: 'beras',
            price: 15000,
            qty: 1,
            supplierName: 'Gacorian'
          }
        ]
      }
    }
  });

  console.log("Successfully created test order for Gacorian:", order);
}

main().catch(console.error);
