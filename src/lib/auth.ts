import { Role } from "@/generated/prisma/enums";

export class AuthRequiredError extends Error {
  constructor(public role: Role) {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}
