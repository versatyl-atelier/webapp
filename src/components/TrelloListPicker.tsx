"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { getTrelloLists } from "@/actions/trello";
import { FieldErrors } from "@/components/FieldErrors";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SAVED_TOAST_OPTIONS } from "@/constants/projects";
import {
  TRELLO_BOARD_LABEL,
  TRELLO_BOARD_PLACEHOLDER,
  TRELLO_CLEARED_MESSAGE,
  TRELLO_CLEAR_LABEL,
  TRELLO_LISTS_LOADING_LABEL,
  TRELLO_LIST_LABEL,
  TRELLO_LIST_PLACEHOLDER,
  TRELLO_SAVED_MESSAGE,
  TRELLO_SAVE_LABEL,
} from "@/constants/trello";

export type TrelloListChoice = {
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
};

type TrelloListPickerProps = {
  label: string;
  boards: readonly { id: string; name: string }[];
  current: TrelloListChoice | null;
  onSave: (listId: string) => Promise<string | null>;
  onClear: () => Promise<void>;
};

export function TrelloListPicker({
  label,
  boards,
  current,
  onSave,
  onClear,
}: TrelloListPickerProps) {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [boardId, setBoardId] = useState<string | null>(
    current?.boardId ?? null,
  );
  const [listId, setListId] = useState<string | null>(current?.listId ?? null);
  const [lists, setLists] = useState(
    current ? [{ id: current.listId, name: current.listName }] : [],
  );
  const [error, setError] = useState<string>();
  const currentBoardId = current?.boardId ?? null;

  useEffect(() => {
    if (currentBoardId === null) {
      return;
    }
    let cancelled = false;
    void getTrelloLists(currentBoardId).then((fetched) => {
      if (!cancelled) {
        setLists(fetched);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentBoardId]);
  const boardItems = boards.map(({ id: value, name }) => ({
    value,
    label: name,
  }));
  const listItems = lists.map(({ id: value, name }) => ({
    value,
    label: name,
  }));

  const changeBoard = (value: string | null) => {
    if (value === null || value === boardId) {
      return;
    }
    setBoardId(value);
    setListId(null);
    setLists([]);
    setError(undefined);
    startTransition(async () => {
      setLists(await getTrelloLists(value));
    });
  };

  const save = () =>
    startTransition(async () => {
      if (listId === null) {
        return;
      }
      const message = await onSave(listId);
      setError(message ?? undefined);
      if (message === null) {
        toast.success(TRELLO_SAVED_MESSAGE, SAVED_TOAST_OPTIONS);
      }
    });

  const clear = () =>
    startTransition(async () => {
      await onClear();
      setBoardId(null);
      setListId(null);
      setLists([]);
      toast.success(TRELLO_CLEARED_MESSAGE, SAVED_TOAST_OPTIONS);
    });

  return (
    <div className="grid items-start gap-3 sm:grid-cols-[12rem_1fr_1fr_12rem]">
      <p className="self-center text-sm font-medium">{label}</p>
      <Field className="gap-1">
        <FieldLabel htmlFor={`${id}-board`} className="sr-only">
          {`${label} — ${TRELLO_BOARD_LABEL}`}
        </FieldLabel>
        <Select items={boardItems} value={boardId} onValueChange={changeBoard}>
          <SelectTrigger id={`${id}-board`} className="w-full">
            <SelectValue placeholder={TRELLO_BOARD_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            {boardItems.map(({ value, label: name }) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field className="gap-1">
        <FieldLabel htmlFor={`${id}-list`} className="sr-only">
          {`${label} — ${TRELLO_LIST_LABEL}`}
        </FieldLabel>
        <Select
          items={listItems}
          value={listId}
          onValueChange={setListId}
          disabled={boardId === null || pending}
        >
          <SelectTrigger id={`${id}-list`} className="w-full">
            <SelectValue
              placeholder={
                pending ? TRELLO_LISTS_LOADING_LABEL : TRELLO_LIST_PLACEHOLDER
              }
            />
          </SelectTrigger>
          <SelectContent>
            {listItems.map(({ value, label: name }) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldErrors errors={error ? [error] : undefined} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || listId === null || listId === current?.listId}
          onClick={save}
        >
          {TRELLO_SAVE_LABEL}
        </Button>
        {current && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={clear}
          >
            {TRELLO_CLEAR_LABEL}
          </Button>
        )}
      </div>
    </div>
  );
}
