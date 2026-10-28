"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  COPIED_LABEL,
  COPY_LABEL,
  DONE_LABEL,
  TEMPORARY_PASSWORD_NOTICE,
  TEMPORARY_PASSWORD_TITLE,
} from "@/constants/accounts";

type TemporaryPasswordNoticeProps = {
  password: string;
  onDone: () => void;
};

export function TemporaryPasswordNotice({
  password,
  onDone,
}: TemporaryPasswordNoticeProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">{TEMPORARY_PASSWORD_NOTICE}</p>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase">
          {TEMPORARY_PASSWORD_TITLE}
        </p>
        <div className="flex items-center gap-2">
          <code className="bg-muted flex-1 rounded border-2 px-2 py-1.5 text-center font-mono text-base tracking-wider select-all">
            {password}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="rounded-sm text-xs font-semibold uppercase"
          >
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? COPIED_LABEL : COPY_LABEL}
          </Button>
        </div>
        <p role="status" className="sr-only">
          {isCopied ? COPIED_LABEL : ""}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onDone}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {DONE_LABEL}
      </Button>
    </div>
  );
}
