"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { Employee } from "@/generated/prisma/client";

type EmployeeSelectProps = {
  employees: Employee[];
  currentEmployeeId: number | null;
  className?: string;
};

export function EmployeeSelect({
  employees,
  currentEmployeeId,
  className,
}: EmployeeSelectProps) {
  return (
    <div className={className}>
      <Combobox
        items={employees}
        autoHighlight
        itemToStringLabel={(employee: Employee) => employee.name}
        onValueChange={(employee) => {
          if (employee) {
            window.location.href = `/punch/employe/${employee.id}`;
          }
        }}
        defaultOpen
      >
        <ComboboxInput
          className="border-punch-dark hover:border-punch-accent focus-visible:border-punch-accent active:border-punch-accent border-2 py-2"
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
                    "bg-punch-accent/15 font-bold",
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
