export function pinEmployeeFirst<T extends { id: number }>(
  employees: T[],
  employeeId: number | null,
): T[] {
  if (employeeId === null) {
    return employees;
  }
  return [
    ...employees.filter((employee) => employee.id === employeeId),
    ...employees.filter((employee) => employee.id !== employeeId),
  ];
}
