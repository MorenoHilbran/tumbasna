import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gacorianProducts = await prisma.productEntry.findMany({
    where: { user: { name: 'Gacorian' } },
  });
  console.log(JSON.stringify(gacorianProducts.map(p => ({
    id: p.id,
    commodity: p.commodity,
    image: p.image
  })), null, 2));
}

main().then(() => process.exit(0));
