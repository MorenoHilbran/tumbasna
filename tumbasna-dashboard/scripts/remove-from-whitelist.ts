import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phoneNumber = process.argv[2];
  if (!phoneNumber) {
    console.error('Please provide a phone number as an argument.');
    process.exit(1);
  }

  const updated = await prisma.chatSession.update({
    where: { phoneNumber },
    data: { isWhitelisted: false }
  });
  console.log('Successfully Blacklisted User (isWhitelisted: false):', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
