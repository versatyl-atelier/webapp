"use client";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { SUGGESTIONS_LIMIT } from "@/constants/projects";

type SuggestInputProps = {
  id: string;
  suggestions: readonly string[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
};

export function SuggestInput({
  id,
  suggestions,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  invalid,
  className,
}: SuggestInputProps) {
  return (
    <Autocomplete
      items={suggestions}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      limit={SUGGESTIONS_LIMIT}
      autoHighlight
      openOnInputClick
    >
      <AutocompleteInput
        id={id}
        placeholder={placeholder}
        aria-invalid={invalid}
        className={className}
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
  );
}
