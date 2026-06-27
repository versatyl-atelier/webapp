"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
} from "@/components/ui/combobox";
import { Employee } from "@/generated/prisma/client";

type EmployeeSelectProps = {
  employees: Employee[];
};

export function EmployeeSelect({ employees }: EmployeeSelectProps) {
  return (
    <Combobox
      items={employees}
      autoHighlight
      itemToStringLabel={(employee: Employee) => employee.name}
      onValueChange={(employee) => {
        if (employee) {
          window.location.href = `/employee/${employee.id}`;
        }
      }}
    >
      <ComboboxInput
        className="border-punch-dark hover:border-punch-accent focus-visible:border-punch-accent active:border-punch-accent border-2 py-7"
        placeholder="-- Choisir employé --"
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>Aucun employé trouvé</ComboboxEmpty>
        <ComboboxList>
          {(employee) => (
            <ComboboxItem key={employee.id} value={employee}>
              {employee.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
