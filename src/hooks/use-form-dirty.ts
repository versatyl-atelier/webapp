"use client";

import { useRef } from "react";

function formSnapshot(form: HTMLFormElement | null): string {
  return form ? JSON.stringify([...new FormData(form).entries()]) : "";
}

export function useFormDirty() {
  const form = useRef<HTMLFormElement | null>(null);
  const initial = useRef<string | null>(null);

  const ref = (node: HTMLFormElement | null) => {
    form.current = node;
    if (node && initial.current === null) {
      initial.current = formSnapshot(node);
    }
  };

  const isDirty = () =>
    initial.current !== null && formSnapshot(form.current) !== initial.current;

  const submit = () => form.current?.requestSubmit();

  return { ref, isDirty, submit };
}
