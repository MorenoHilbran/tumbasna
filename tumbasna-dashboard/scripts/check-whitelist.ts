import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.chatSession.findMany({
    where: { isWhitelisted: true }
  });
  console.log('--- WHITELISTED USERS IN CHATSESSION ---');
  console.log(JSON.stringify(sessions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
