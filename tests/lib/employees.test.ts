import { describe, expect, it } from "vitest";

import { pinEmployeeFirst } from "@/lib/employees";

const employees = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("pinEmployeeFirst", () => {
  it("moves the matching employee to the top and keeps the rest in order", () => {
    expect(pinEmployeeFirst(employees, 3)).toEqual([
      { id: 3 },
      { id: 1 },
      { id: 2 },
    ]);
  });

  it("returns the list unchanged when there is no current employee", () => {
    expect(pinEmployeeFirst(employees, null)).toEqual(employees);
  });

  it("returns the list unchanged when the employee is not in it", () => {
    expect(pinEmployeeFirst(employees, 99)).toEqual(employees);
  });
});
