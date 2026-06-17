import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const numbers = [
  "6282225200090",
  "628562850774",
  "6285814174267",
  "6281353424280",
  "6282241087421",
  "6287864562253" // Whitelisted again
];

async function main() {
  console.log(`🚀 Re-whitelisting ${numbers.length} users with ChatSession model...`);
  
  for (const number of numbers) {
    const s = await prisma.chatSession.upsert({
      where: { phoneNumber: number },
      update: { isWhitelisted: true },
      create: {
        phoneNumber: number,
        isWhitelisted: true,
        history: []
      }
    });
    console.log(`✅ Whitelisted in ChatSession: ${s.phoneNumber}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
