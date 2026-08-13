const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRegencyTrx() {
  const orders = await prisma.order.findMany({ 
    select: { id: true, status: true, supplierCity: true, buyerCity: true, supplierLocation: true, buyerAddress: true } 
  });
  
  console.log('Total Orders in DB:', orders.length);
  const counts = {};
  for (const o of orders) {
    const loc = (o.supplierCity || o.supplierLocation || o.buyerCity || o.buyerAddress || '').toLowerCase();
    let reg = 'Lainnya';
    if (loc.includes('banyumas')) reg = 'Banyumas';
    else if (loc.includes('purbalingga')) reg = 'Purbalingga';
    else if (loc.includes('banjarnegara')) reg = 'Banjarnegara';
    else if (loc.includes('cilacap')) reg = 'Cilacap';
    else if (loc.includes('kebumen')) reg = 'Kebumen';
    else if (loc.includes('tegal')) reg = 'Tegal';
    else if (loc.includes('pemalang')) reg = 'Pemalang';
    else if (loc.includes('brebes')) reg = 'Brebes';
    
    counts[reg] = (counts[reg] || 0) + 1;
  }
  
  console.log('Real QRIS Transactions per Regency:', counts);
  await prisma.$disconnect();
}

checkRegencyTrx();
