import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const session = await prisma.chatSession.findUnique({
    where: { phoneNumber: '218515084722427' }
  });
  console.log('--- SESSION HISTORY FOR 218515084722427 ---');
  console.log(JSON.stringify(session, null, 2));

  const users = await prisma.user.findMany({
    where: {
      phoneNumber: {
        in: ['218515084722427', '6285869236023', '085869236023']
      }
    }
  });
  console.log('--- USERS FOR TARGET PHONES ---');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
