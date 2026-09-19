import "dotenv/config";

import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const SEED_MANAGER_EMAIL = process.env.SEED_MANAGER_EMAIL;
const SEED_MANAGER_PASSWORD = process.env.SEED_MANAGER_PASSWORD;
const SEED_MANAGER_NAME = process.env.SEED_MANAGER_NAME;
const CREDENTIAL_PROVIDER_ID = "credential";

async function seedManager() {
  if (!SEED_MANAGER_EMAIL || !SEED_MANAGER_PASSWORD || !SEED_MANAGER_NAME) {
    throw new Error(
      "The SEED_MANAGER_EMAIL, SEED_MANAGER_PASSWORD and SEED_MANAGER_NAME environment variables must have non-empty values in .env",
    );
  }
  const email = SEED_MANAGER_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Manager ${email} already exists, skipping`);
    return;
  }

  const context = await auth.$context;
  const user = await context.internalAdapter.createUser(
    {
      email,
      name: SEED_MANAGER_NAME,
      role: Role.manager,
      emailVerified: true,
      mustChangePassword: true,
    },
    { method: "admin" },
  );
  await context.internalAdapter.linkAccount({
    userId: user.id,
    providerId: CREDENTIAL_PROVIDER_ID,
    accountId: user.id,
    password: await context.password.hash(SEED_MANAGER_PASSWORD),
  });
  console.log(`Manager ${email} created`);
}

seedManager()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
