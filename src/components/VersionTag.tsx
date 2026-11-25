"use client";

import { Check, Copy } from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { COPIED_LABEL } from "@/constants/accounts";
import {
  COPY_COMMIT_SHA_LABEL,
  COPY_CONFIRMATION_DURATION_MS,
  SHORT_COMMIT_SHA_LENGTH,
  VERSION_LABEL,
} from "@/constants/version";
import { useIsAltPressed } from "@/hooks/use-alt-key";
import { EMPTY_TAP_STREAK, registerTap } from "@/lib/version";

type VersionTagProps = {
  version: string;
  commitSha: string | null;
};

export function VersionTag({ version, commitSha }: VersionTagProps) {
  const isAltPressed = useIsAltPressed();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tapStreakRef = useRef(EMPTY_TAP_STREAK);

  useEffect(() => {
    if (!isCopied) return;
    const timeout = setTimeout(
      () => setIsCopied(false),
      COPY_CONFIRMATION_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [isCopied]);

  useEffect(() => {
    if (!isRevealed) return;
    function handleOutsidePointerDown(event: globalThis.PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsRevealed(false);
    }
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isRevealed]);

  function handleVersionTap(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "mouse") return;
    const { streak, isComplete } = registerTap(
      tapStreakRef.current,
      event.timeStamp,
    );
    tapStreakRef.current = streak;
    if (isComplete) setIsRevealed((revealed) => !revealed);
  }

  async function handleCopy(sha: string) {
    try {
      await navigator.clipboard.writeText(sha);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <span ref={containerRef}>
      <span
        onPointerUp={handleVersionTap}
        className="relative touch-manipulation after:absolute after:inset-x-0 after:-inset-y-3"
      >
        {VERSION_LABEL}
        {version}
      </span>
      {commitSha && (isAltPressed || isRevealed) && (
        <>
          {" · "}
          <span className="font-mono">
            {commitSha.slice(0, SHORT_COMMIT_SHA_LENGTH)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={COPY_COMMIT_SHA_LABEL}
            onClick={() => handleCopy(commitSha)}
            className="-my-1.5"
          >
            {isCopied ? <Check /> : <Copy />}
          </Button>
        </>
      )}
      <span role="status" className="sr-only">
        {isCopied ? COPIED_LABEL : ""}
      </span>
    </span>
  );
}
