"use client";

import type { Jobine, Project, Task } from "@/generated/prisma/client";
import { createContext, PropsWithChildren, useContext } from "react";

interface PageContextType {
  projectsPromise: Promise<Project[] | null>;
  tasksPromise: Promise<Task[] | null>;
  jobinesPromise: Promise<Jobine[] | null>;
}

const PageContext = createContext<PageContextType | null>(null);

type PageContextProviderProps = PropsWithChildren<PageContextType>;
export function PageContextProvider({
  children,
  projectsPromise,
  tasksPromise,
  jobinesPromise,
}: PageContextProviderProps) {
  return (
    <PageContext.Provider
      value={{ projectsPromise, tasksPromise, jobinesPromise }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error(
      "`usePageContext` must be used within a PageContextProvider",
    );
  }
  return context;
}
