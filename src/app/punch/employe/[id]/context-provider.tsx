"use client";

import type { Project, Task } from "@/generated/prisma/client";
import { createContext, PropsWithChildren, useContext } from "react";

interface PageContextType {
  projectsPromise: Promise<Project[] | null>;
  tasksPromise: Promise<Task[] | null>;
}

const PageContext = createContext<PageContextType | null>(null);

type PageContextProviderProps = PropsWithChildren<PageContextType>;
export function PageContextProvider({
  children,
  projectsPromise,
  tasksPromise,
}: PageContextProviderProps) {
  return (
    <PageContext.Provider value={{ projectsPromise, tasksPromise }}>
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
