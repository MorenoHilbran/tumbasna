import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.productEntry.findMany();
  for (const p of products) {
    if (p.image && p.image.includes('URL Foto: ')) {
      const cleanUrl = p.image.replace('URL Foto: ', '').trim();
      await prisma.productEntry.update({
        where: { id: p.id },
        data: { image: cleanUrl }
      });
      console.log(`Updated product ${p.id} image to: ${cleanUrl}`);
    }
  }
}

main().then(() => process.exit(0));
