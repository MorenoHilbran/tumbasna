import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.productEntry.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    commodity: p.commodity,
    supplier: p.user?.name,
    status: p.status,
    image: p.image,
    createdAt: p.createdAt
  })), null, 2));
}

main().then(() => process.exit(0));
