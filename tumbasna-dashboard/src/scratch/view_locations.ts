import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATA IN DATABASE ===');
  
  const userCount = await prisma.user.count();
  console.log(`Total Users: ${userCount}`);
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phoneNumber: true, role: true, address: true }
  });
  console.log('Users list:');
  users.forEach(u => {
    console.log(`- [${u.role}] ${u.name} (${u.phoneNumber}) - Address: ${u.address}`);
  });
  
  const productCount = await prisma.productEntry.count();
  console.log(`\nTotal Product Entries: ${productCount}`);
  
  const products = await prisma.productEntry.findMany({
    select: { id: true, type: true, commodity: true, location: true, qty: true, price: true }
  });
  console.log('Product Entries:');
  products.forEach(p => {
    console.log(`- [${p.type}] ${p.commodity} (${p.qty}kg @ Rp${p.price}) in ${p.location}`);
  });
  
  const orderCount = await prisma.order.count();
  console.log(`\nTotal Orders: ${orderCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
