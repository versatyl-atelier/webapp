"use client";

import { Bold, Italic, RemoveFormatting, Underline } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  RICH_TEXT_BOLD_CLASS,
  RICH_TEXT_BOLD_LABEL,
  RICH_TEXT_CLEAR_LABEL,
  RICH_TEXT_COLORS,
  RICH_TEXT_COLOR_HEX,
  RICH_TEXT_COLOR_LABELS,
  RICH_TEXT_COLOR_PREFIX,
  RICH_TEXT_COLOR_SWATCH_CLASSES,
  RICH_TEXT_COLOR_TEXT_CLASSES,
  RICH_TEXT_COMMANDS,
  RICH_TEXT_ITALIC_CLASS,
  RICH_TEXT_ITALIC_LABEL,
  RICH_TEXT_TOOLBAR_LABEL,
  RICH_TEXT_UNDERLINE_CLASS,
  RICH_TEXT_UNDERLINE_LABEL,
} from "@/constants/richText";
import {
  normalizeStoredRichText,
  parseRichText,
  richTextFromDom,
  serializeRichText,
  type RichRun,
} from "@/lib/richText";
import { cn } from "@/lib/utils";

const EDITOR_CLASS =
  "min-h-7 w-full rounded-sm px-1 py-1 text-xs leading-snug whitespace-pre-wrap outline-none hover:bg-muted focus:bg-muted print:p-0 print:hover:bg-transparent";
const TOOLBAR_CLASS =
  "bg-popover text-popover-foreground absolute right-0 bottom-full z-20 hidden items-center gap-0.5 rounded-md border p-1 shadow-md group-focus-within:flex print:hidden";

function runClassName(run: RichRun): string {
  return cn(
    run.bold && RICH_TEXT_BOLD_CLASS,
    run.italic && RICH_TEXT_ITALIC_CLASS,
    run.underline && RICH_TEXT_UNDERLINE_CLASS,
    run.color && RICH_TEXT_COLOR_TEXT_CLASSES[run.color],
  );
}

function renderRuns(element: HTMLElement, runs: readonly RichRun[]) {
  element.replaceChildren(
    ...runs.map((run) => {
      const className = runClassName(run);
      if (className === "") {
        return document.createTextNode(run.text);
      }
      const span = document.createElement("span");
      span.className = className;
      span.textContent = run.text;
      return span;
    }),
  );
}

function runCommand(command: string, argument?: string) {
  document.execCommand(command, false, argument);
}

type ToolbarButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
};

function ToolbarButton({ label, onPress, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {children}
    </Button>
  );
}

type RichTextEditorProps = {
  value: string;
  label: string;
  onCommit: (value: string) => void;
};

export function RichTextEditor({
  value,
  label,
  onCommit,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element && document.activeElement !== element) {
      renderRuns(element, parseRichText(value));
    }
  }, [value]);

  function commit() {
    const element = ref.current;
    if (!element) {
      return;
    }
    const next = serializeRichText(richTextFromDom(element));
    if (next !== normalizeStoredRichText(value)) {
      onCommit(next);
    }
  }

  return (
    <div className="group relative">
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        className={EDITOR_CLASS}
        onBlur={commit}
      />
      <div
        role="toolbar"
        aria-label={RICH_TEXT_TOOLBAR_LABEL}
        className={TOOLBAR_CLASS}
      >
        <ToolbarButton
          label={RICH_TEXT_BOLD_LABEL}
          onPress={() => runCommand(RICH_TEXT_COMMANDS.bold)}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label={RICH_TEXT_ITALIC_LABEL}
          onPress={() => runCommand(RICH_TEXT_COMMANDS.italic)}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label={RICH_TEXT_UNDERLINE_LABEL}
          onPress={() => runCommand(RICH_TEXT_COMMANDS.underline)}
        >
          <Underline />
        </ToolbarButton>
        {RICH_TEXT_COLORS.map((color) => (
          <ToolbarButton
            key={color}
            label={`${RICH_TEXT_COLOR_PREFIX} ${RICH_TEXT_COLOR_LABELS[color].toLowerCase()}`}
            onPress={() =>
              runCommand(
                RICH_TEXT_COMMANDS.foreColor,
                RICH_TEXT_COLOR_HEX[color],
              )
            }
          >
            <span
              aria-hidden
              className={cn(
                "size-3 rounded-full",
                RICH_TEXT_COLOR_SWATCH_CLASSES[color],
              )}
            />
          </ToolbarButton>
        ))}
        <ToolbarButton
          label={RICH_TEXT_CLEAR_LABEL}
          onPress={() => runCommand(RICH_TEXT_COMMANDS.removeFormat)}
        >
          <RemoveFormatting />
        </ToolbarButton>
      </div>
    </div>
  );
}
