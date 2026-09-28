"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
} from "@/components/ui/combobox";
import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchEmployee } from "@/actions/auth";
import { SWITCH_EMPLOYEE_SUCCESS_MESSAGE } from "@/constants/auth";
import { employeePath, loginPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { Employee } from "@/generated/prisma/client";

type EmployeeSelectProps = {
  employees: Employee[];
  currentEmployeeId: number | null;
  canAccessAll: boolean;
  className?: string;
};

export function EmployeeSelect({
  employees,
  currentEmployeeId,
  canAccessAll,
  className,
}: EmployeeSelectProps) {
  const router = useRouter();
  const [state, action] = useActionState(switchEmployee, undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (
      state?.message !== SWITCH_EMPLOYEE_SUCCESS_MESSAGE ||
      state.employeeId === undefined
    ) {
      return;
    }
    router.push(loginPath(employeePath(state.employeeId), state.email));
  }, [state, router]);

  const select = (employee: Employee) => {
    if (canAccessAll || employee.id === currentEmployeeId) {
      window.location.href = employeePath(employee.id);
      return;
    }
    const formData = new FormData();
    formData.set("employeeId", String(employee.id));
    startTransition(() => action(formData));
  };

  return (
    <div className={className}>
      <Combobox
        items={employees}
        autoHighlight
        itemToStringLabel={(employee: Employee) => employee.name}
        onValueChange={(employee) => {
          if (employee) {
            select(employee);
          }
        }}
        defaultOpen
      >
        <ComboboxInput
          className="hover:border-primary focus-visible:border-primary active:border-primary border-2 py-2"
          placeholder="-- Choisir employé --"
          autoFocus
          showClear
        />
        <ComboboxContent>
          <ComboboxEmpty>Aucun employé trouvé</ComboboxEmpty>
          <ComboboxList className="max-h-11/12">
            {(employee) => (
              <ComboboxItem
                key={employee.id}
                value={employee}
                className={cn(
                  employee.id === currentEmployeeId &&
                    "bg-primary/15 font-bold",
                )}
              >
                {employee.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
