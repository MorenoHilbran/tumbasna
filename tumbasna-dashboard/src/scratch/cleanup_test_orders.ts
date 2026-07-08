import prisma from '../lib/prisma';

async function main() {
  const ids = ['TRX-TEST-VALID-MOCK', 'TRX-TEST-VALID', 'TRX-TEST-UUID', 'TRX-GACORIAN-TEST'];
  
  await prisma.orderItem.deleteMany({
    where: { orderId: { in: ids } }
  });
  await prisma.order.deleteMany({
    where: { id: { in: ids } }
  });

  console.log("Cleanup complete!");
}

main().catch(console.error);
