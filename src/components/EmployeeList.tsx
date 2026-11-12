"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  EMPLOYEES_FILTER_LABEL,
  EMPLOYEES_FILTER_PLACEHOLDER,
  EMPLOYEES_LABEL,
  NO_EMPLOYEE_LABEL,
} from "@/constants/punch";
import type { Employee } from "@/generated/prisma/client";
import { employeePath } from "@/lib/paths";
import { normalize } from "@/lib/text";

export type EmployeeListItem = Pick<Employee, "id" | "name">;

type EmployeeListProps = {
  employees: EmployeeListItem[];
  filterable: boolean;
};

export function EmployeeList({ employees, filterable }: EmployeeListProps) {
  const inputId = useId();
  const { id } = useParams<{ id?: string }>();
  const [query, setQuery] = useState("");
  const needle = normalize(query);
  const matches = employees.filter(({ name }) =>
    normalize(name).includes(needle),
  );

  return (
    <>
      {filterable && (
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <SidebarGroup className="shrink-0 py-0">
            <SidebarGroupContent className="relative">
              <Label htmlFor={inputId} className="sr-only">
                {EMPLOYEES_FILTER_LABEL}
              </Label>
              <SidebarInput
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={EMPLOYEES_FILTER_PLACEHOLDER}
                className="pl-8"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      )}
      <SidebarGroup className="min-h-12">
        <SidebarGroupLabel className="uppercase">
          {EMPLOYEES_LABEL} ({matches.length})
        </SidebarGroupLabel>
        <div className="min-h-0 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="text-muted-foreground px-2 text-sm">
              {NO_EMPLOYEE_LABEL}
            </p>
          ) : (
            <SidebarMenu>
              {matches.map((employee) => (
                <SidebarMenuItem key={employee.id}>
                  <SidebarMenuButton
                    render={
                      <Link
                        href={employeePath(employee.id)}
                        title={employee.name}
                      />
                    }
                    isActive={String(employee.id) === id}
                  >
                    <span className="truncate">{employee.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </div>
      </SidebarGroup>
    </>
  );
}
