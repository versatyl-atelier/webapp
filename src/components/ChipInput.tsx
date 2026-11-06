"use client";

import { X } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CLADDING_COMMIT_KEYS,
  CLADDING_REMOVE_KEY,
  REMOVE_CLADDING_LABEL,
  SUGGESTIONS_LIMIT,
} from "@/constants/projects";

type ChipInputProps = {
  id: string;
  name: string;
  suggestions: readonly string[];
  defaultValue?: readonly string[];
  placeholder?: string;
};

function isCommitKey(key: string): boolean {
  return CLADDING_COMMIT_KEYS.some((commitKey) => commitKey === key);
}

export function ChipInput({
  id,
  name,
  suggestions,
  defaultValue = [],
  placeholder,
}: ChipInputProps) {
  const [chips, setChips] = useState<string[]>([...defaultValue]);
  const [text, setText] = useState("");
  const highlighted = useRef<string | undefined>(undefined);

  const withChip = (current: readonly string[], raw: string) => {
    const value = raw.trim();
    return !value ||
      current.some((chip) => chip.toLowerCase() === value.toLowerCase())
      ? [...current]
      : [...current, value];
  };

  const commit = (raw: string) => {
    setChips((current) => withChip(current, raw));
    setText("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      isCommitKey(event.key) &&
      text.trim() &&
      highlighted.current === undefined
    ) {
      event.preventDefault();
      commit(text);
    } else if (event.key === CLADDING_REMOVE_KEY && !text && chips.length > 0) {
      setChips((current) => current.slice(0, -1));
    }
  };

  return (
    <div className="border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex flex-wrap items-center gap-1 rounded-lg border p-1 focus-within:ring-3">
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(withChip(chips, text))}
      />
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary" className="h-6 gap-0.5 pr-0.5">
          {chip}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`${REMOVE_CLADDING_LABEL} ${chip}`}
            className="size-4"
            onClick={() =>
              setChips((current) => current.filter((value) => value !== chip))
            }
          >
            <X />
          </Button>
        </Badge>
      ))}
      <Autocomplete
        items={suggestions.filter((suggestion) => !chips.includes(suggestion))}
        value={text}
        onValueChange={(value, details) => {
          if (details.reason === "item-press") {
            commit(value);
          } else {
            setText(value);
          }
        }}
        onItemHighlighted={(value) => {
          highlighted.current = value;
        }}
        limit={SUGGESTIONS_LIMIT}
        autoHighlight
        openOnInputClick
      >
        <AutocompleteInput
          id={id}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          className="h-6 min-w-24 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <AutocompleteContent>
          <AutocompleteList>
            {(item: string) => (
              <AutocompleteItem key={item} value={item}>
                {item}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  );
}
