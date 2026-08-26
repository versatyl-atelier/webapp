import { Pool } from "pg";

import { Layer } from "effect";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

import { PrismaService, PrismaClientService } from "@/generated/effect-prisma";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;

export const PrismaLayer = Layer.provide(
  PrismaService.Default,
  Layer.succeed(PrismaClientService, prisma),
);
