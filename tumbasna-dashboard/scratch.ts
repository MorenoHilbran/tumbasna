import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.productEntry.findMany({
    include: { user: true },
  });
  console.log(JSON.stringify(products.map(p => ({
    commodity: p.commodity,
    supplier: p.user?.name,
    status: p.status
  })), null, 2));
}

main().then(() => process.exit(0));
