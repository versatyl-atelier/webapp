import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "dotenv";

import {
  AUTH_DIR,
  DEFAULT_ROLE,
  ENVS,
  type EnvName,
  type Role,
} from "./config";

const BASE_URL_VARIABLE = "BETTER_AUTH_URL";
const CREDENTIAL_PREFIX = "AUTOMATION_";
const EMAIL_SUFFIX = "_EMAIL";
const PASSWORD_SUFFIX = "_PASSWORD";
export const BYPASS_SECRET_VARIABLE = "VERCEL_AUTOMATION_BYPASS_SECRET";
const STORAGE_STATE_EXTENSION = ".json";

export class ScreenshotError extends Error {}

export type Credentials = { email: string; password: string };

export type Env = {
  name: EnvName;
  role: Role;
  envFile: string;
  baseUrl: string;
  credentials: Credentials | null;
  credentialVariables: string;
  bypassSecret: string | null;
  storageStatePath: string;
  fixedClock: boolean;
};

export function isEnvName(value: string): value is EnvName {
  return Object.hasOwn(ENVS, value);
}

export function loadEnv(name: EnvName, role: Role): Env {
  const { envFile, fixedClock, processEnvCredentials } = ENVS[name];
  if (!existsSync(envFile)) {
    throw new ScreenshotError(`${envFile} is missing, see README.md`);
  }
  const values = parse(readFileSync(envFile));
  const pick = (variables: string[]) =>
    variables
      .flatMap((variable) => [
        processEnvCredentials ? process.env[variable] : undefined,
        values[variable],
      ])
      .find(Boolean) ?? null;
  const baseUrl = values[BASE_URL_VARIABLE];
  if (!baseUrl) {
    throw new ScreenshotError(
      `The ${BASE_URL_VARIABLE} environment variable must have a non-empty value in ${envFile}`,
    );
  }
  const prefix = `${CREDENTIAL_PREFIX}${role.toUpperCase()}`;
  const emailVariable = `${prefix}${EMAIL_SUFFIX}`;
  const passwordVariable = `${prefix}${PASSWORD_SUFFIX}`;
  const email = pick([emailVariable]);
  const password = pick([passwordVariable]);
  return {
    name,
    role,
    envFile,
    baseUrl: new URL(baseUrl).origin,
    credentials: email && password ? { email, password } : null,
    credentialVariables: `${emailVariable} and ${passwordVariable} in ${envFile}`,
    bypassSecret: pick([BYPASS_SECRET_VARIABLE]),
    storageStatePath: join(
      AUTH_DIR,
      `${name}.${role}${STORAGE_STATE_EXTENSION}`,
    ),
    fixedClock,
  };
}

export function baseUrls(names: readonly EnvName[]) {
  return Object.fromEntries(
    names.flatMap((name) => {
      try {
        return [[name, loadEnv(name, DEFAULT_ROLE).baseUrl]];
      } catch {
        return [];
      }
    }),
  );
}
