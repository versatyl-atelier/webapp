"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_TAB_PARAM, PROJECT_TABS } from "@/constants/projects";
import type { ProjectTab } from "@/lib/projectTabs";

type ProjectTabsProps = {
  tab: ProjectTab;
  children: ReactNode;
};

export function ProjectTabs({ tab, children }: ProjectTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        router.replace(`${pathname}?${PROJECT_TAB_PARAM}=${value}`, {
          scroll: false,
        })
      }
    >
      <TabsList variant="line">
        {PROJECT_TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
