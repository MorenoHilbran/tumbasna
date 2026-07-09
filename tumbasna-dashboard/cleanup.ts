import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.productEntry.deleteMany({
    where: { 
      user: { name: 'Gacorian' },
      commodity: 'bawang merah'
    }
  });
  console.log("Deleted old bawang merah from Gacorian.");
}

main().then(() => process.exit(0));
