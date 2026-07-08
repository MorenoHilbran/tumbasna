import prisma from '../lib/prisma';

async function main() {
  const phone = '6285869236023';
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phoneNumber: phone },
        { phoneNumber: '+' + phone },
      ]
    }
  });

  console.log("=== TARGET USER ===");
  if (user) {
    console.log(`ID: ${user.id}, Phone: ${user.phoneNumber}, Name: ${user.name}, BusinessName: ${user.businessName}, Role: ${user.role}`);
  } else {
    console.log("User not found!");
  }

  // Look for any orders containing Gacorian or matching this user
  const orders = await prisma.order.findMany({
    include: {
      items: true
    }
  });

  console.log("\n=== ALL ORDERS ===");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, SupplierName: "${o.supplierName}", BuyerUserID: ${o.buyerUserId}, Total: ${o.totalAmount}, Status: ${o.status}`);
    o.items.forEach(it => {
      console.log(`   - Item: ${it.commodity}, Qty: ${it.qty}, Price: ${it.price}, Supplier: "${it.supplierName}"`);
    });
  });
}

main().catch(console.error);
