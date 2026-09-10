"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getProjectsEffect } from "@/effects/projects";

export const getProjects = cachedGetter(getProjectsEffect, Role.employee);
