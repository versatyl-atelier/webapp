"use client";

import {
  createContext,
  useContext,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
} from "react";

import { SELECTED_ROW_CLASSES } from "@/constants/timesheet";
import { cn } from "@/lib/utils";

const ROW_ID_ATTRIBUTE = "data-row-id";

type SelectableRowsContextValue = {
  rowIds: readonly number[];
  selectedId: number | null;
  select: (id: number) => void;
};

const SelectableRowsContext = createContext<SelectableRowsContextValue | null>(
  null,
);

function useSelectableRows() {
  const context = useContext(SelectableRowsContext);
  if (!context) {
    throw new Error("SelectableRow must be used within SelectableBody.");
  }
  return context;
}

type SelectableBodyProps = PropsWithChildren<{
  rowIds: readonly number[];
}>;

export function SelectableBody({ rowIds, children }: SelectableBodyProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step || selectedId === null) return;

    event.preventDefault();
    const nextIndex = rowIds.indexOf(selectedId) + step;
    const nextId = rowIds[nextIndex];
    if (nextId === undefined) return;

    setSelectedId(nextId);
    event.currentTarget
      .querySelector<HTMLElement>(`[${ROW_ID_ATTRIBUTE}="${nextId}"]`)
      ?.focus();
  }

  return (
    <SelectableRowsContext.Provider
      value={{ rowIds, selectedId, select: setSelectedId }}
    >
      <tbody onKeyDown={handleKeyDown}>{children}</tbody>
    </SelectableRowsContext.Provider>
  );
}

type SelectableRowProps = PropsWithChildren<{
  id: number;
  className?: string;
}>;

export function SelectableRow({ id, className, children }: SelectableRowProps) {
  const { rowIds, selectedId, select } = useSelectableRows();
  const isSelected = selectedId === id;
  const isTabStop = isSelected || (selectedId === null && rowIds[0] === id);

  return (
    <tr
      {...{ [ROW_ID_ATTRIBUTE]: id }}
      data-selected={isSelected || undefined}
      aria-current={isSelected || undefined}
      tabIndex={isTabStop ? 0 : -1}
      onClick={() => select(id)}
      onFocus={() => select(id)}
      className={cn(SELECTED_ROW_CLASSES, className)}
    >
      {children}
    </tr>
  );
}
