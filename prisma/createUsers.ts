import "dotenv/config";

import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const CREATE_USERS_PASSWORD = process.env.CREATE_USERS_PASSWORD;
const CREDENTIAL_PROVIDER_ID = "credential";
const EMAIL_DOMAIN = "versatylatelier.com";
const WHITESPACE = /\s+/g;
const EMAIL_NAME_SEPARATOR = ".";
const DIACRITICS = /[\u0300-\u036f]/g;

function emailFor(name: string) {
  const localPart = name
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .trim()
    .toLowerCase()
    .replace(WHITESPACE, EMAIL_NAME_SEPARATOR);
  return `${localPart}@${EMAIL_DOMAIN}`;
}

async function createUsers() {
  if (!CREATE_USERS_PASSWORD) {
    throw new Error(
      "The CREATE_USERS_PASSWORD environment variable must have a non-empty value in .env",
    );
  }

  const employees = await prisma.employee.findMany({
    where: { isDeleted: false, user: null },
    orderBy: { id: "asc" },
  });
  const context = await auth.$context;
  const passwordHash = await context.password.hash(CREATE_USERS_PASSWORD);

  for (const employee of employees) {
    const email = emailFor(employee.name);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(
        `Email ${email} already taken, skipping employee ${employee.name}`,
      );
      continue;
    }

    const user = await context.internalAdapter.createUser(
      {
        email,
        name: employee.name,
        role: Role.employee,
        emailVerified: true,
        mustChangePassword: true,
        employeeId: employee.id,
      },
      { method: "admin" },
    );
    await context.internalAdapter.linkAccount({
      userId: user.id,
      providerId: CREDENTIAL_PROVIDER_ID,
      accountId: user.id,
      password: passwordHash,
    });
    console.log(`User ${email} created for employee ${employee.name}`);
  }
}

createUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
