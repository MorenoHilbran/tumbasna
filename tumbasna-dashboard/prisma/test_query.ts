import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- FETCHING ORDERS ---');
  const orders = await prisma.order.findMany({
    include: {
      buyer: true,
      items: true
    }
  });

  console.log(`Total orders: ${orders.length}`);
  orders.forEach((o, index) => {
    console.log(`[Order ${index + 1}] ID: ${o.id}`);
    console.log(`  Supplier: ${o.supplierName} (${o.supplierLocation})`);
    console.log(`  Buyer: ${o.buyer?.name || 'Null'} (Address: ${o.buyer?.address || 'Null'})`);
    console.log(`  Status: ${o.status}`);
    console.log(`  Items: ${o.items.map(it => `${it.commodity} (${it.qty} kg)`).join(', ')}`);
    console.log('---------------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
