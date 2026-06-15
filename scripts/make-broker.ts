// make-broker.ts — make manumustudio@gmail.com resolve to a BROKER on login.
// Idempotent: safe to re-run. Run from the fixturelog repo root:
//   npx tsx scripts/make-broker.ts
// (or with the same runner your seed uses).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'manumustudio@gmail.com';

async function main(): Promise<void> {
  // 1. Ensure a Broker exists for this email (email is not @unique → find-or-create).
  let broker = await prisma.broker.findFirst({ where: { email: EMAIL } });
  if (broker === null) {
    broker = await prisma.broker.create({
      data: { name: 'Manu Murillo', email: EMAIL, office: 'ManuMu Offshore Partners' },
    });
    console.log(`Created broker ${broker.id} for ${EMAIL}`);
  } else {
    console.log(`Broker already exists for ${EMAIL}: ${broker.id}`);
  }

  // 2. If an AppUser already exists for this email (a prior login may have auto-linked
  //    it to a charterer in dev), relink it to the broker and clear the charterer link.
  const relinked = await prisma.appUser.updateMany({
    where: { email: EMAIL },
    data: { brokerId: broker.id, chartererId: null, role: 'BROKER' },
  });
  console.log(`Relinked ${relinked.count} AppUser row(s) to the broker (role=BROKER).`);

  // 3. Safety: this email must not ALSO be a charterer contact, or resolution is ambiguous.
  const charterer = await prisma.charterer.findFirst({ where: { contactEmail: EMAIL } });
  if (charterer !== null) {
    console.warn(
      `WARNING: a Charterer also has contactEmail ${EMAIL} (id ${charterer.id}). ` +
        `Change that charterer's contactEmail so this email maps only to the broker.`,
    );
  }

  console.log('Done. Sign out and sign back in as', EMAIL, '→ you should land on /dashboard.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
