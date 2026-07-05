import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.productEntry.findMany({
    include: { user: true }
  });
  console.log('--- PRODUCT ENTRIES ---');
  console.log(JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
