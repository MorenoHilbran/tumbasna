const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      items: true
    }
  });
  console.log("Total orders in DB:", orders.length);
  for (const o of orders) {
    console.log(`Order ID: ${o.id}, Status: ${o.status}, BuyerID: ${o.buyerUserId}, Supplier: ${o.supplierName}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
