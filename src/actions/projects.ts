"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import {
  getAllProjectsEffect,
  getProjectEffect,
  getProjectsEffect,
} from "@/effects/projects";

export const getProjects = cachedGetter(getProjectsEffect, [Role.employee]);

export const getAllProjects = cachedGetter(getAllProjectsEffect, [
  Role.manager,
]);

export const getProject = cachedGetter(getProjectEffect, [Role.employee]);
