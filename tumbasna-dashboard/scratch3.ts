import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.productEntry.findMany({
    where: { commodity: 'bawang merah', user: { name: 'Gacorian' } },
    include: { user: true }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().then(() => process.exit(0));
