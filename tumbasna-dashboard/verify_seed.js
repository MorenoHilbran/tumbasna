const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const banjarUsers = await prisma.user.count({ where: { address: { contains: 'Banjarnegara' } } });
  const cilacapUsers = await prisma.user.count({ where: { address: { contains: 'Cilacap' } } });
  const totalEntries = await prisma.productEntry.count();
  const totalOrders = await prisma.order.count();
  const totalMatches = await prisma.match.count();
  
  console.log('✅ DATABASE VERIFICATION REPORT:');
  console.log('• Total UMKM Banjarnegara Users:', banjarUsers);
  console.log('• Total UMKM Cilacap Users:', cilacapUsers);
  console.log('• Total Product Entries:', totalEntries);
  console.log('• Total Matches:', totalMatches);
  console.log('• Total Escrow QRIS Orders:', totalOrders);
  
  await prisma.$disconnect();
}

check();
