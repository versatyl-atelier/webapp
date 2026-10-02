import { ChevronRight, Layers, Pin } from "lucide-react";
import { useId } from "react";

import { NoteComposer } from "@/components/NoteComposer";
import { NoteThread } from "@/components/NoteThread";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GENERAL_NOTES_HEADING, NO_NOTES_LABEL } from "@/constants/projects";
import {
  activeNoteCount,
  noteCountLabel,
  noteSections,
  type NoteAuthor,
  type NoteRecord,
} from "@/lib/projectNotes";
import type { PhaseRecord } from "@/lib/projects";
import { cn } from "@/lib/utils";

const SECTION_HEADER_CLASS =
  "bg-muted/60 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm";

type NotesSectionProps = {
  projectId: string;
  phase: PhaseRecord | null;
  notes: NoteRecord[];
  currentUser: NoteAuthor;
  now: Date;
};

function NotesSection({
  projectId,
  phase,
  notes,
  currentUser,
  now,
}: NotesSectionProps) {
  const headingId = useId();
  const title = phase?.name ?? GENERAL_NOTES_HEADING;
  const Icon = phase ? Layers : Pin;
  const header = (
    <>
      <Icon aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
      <span className="flex-1 font-semibold">{title}</span>
      <span className="text-muted-foreground text-xs">
        {noteCountLabel(activeNoteCount(notes))}
      </span>
    </>
  );
  const body = (
    <div className="px-0.5 pt-0.5">
      {notes.length === 0 ? (
        <p className="text-muted-foreground px-1.5 pt-1 pb-1.5 text-sm italic">
          {NO_NOTES_LABEL}
        </p>
      ) : (
        <ul className="after:bg-border after:right-note-rule relative after:pointer-events-none after:absolute after:inset-y-0.5 after:w-px max-sm:after:hidden">
          {notes.map((note) => (
            <NoteThread
              key={note.id}
              note={note}
              currentUser={currentUser}
              now={now}
            />
          ))}
        </ul>
      )}
      <NoteComposer
        projectId={projectId}
        phaseId={phase?.id ?? null}
        sectionTitle={title}
      />
    </div>
  );

  if (!phase) {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-0.5">
        <h3 id={headingId} className={SECTION_HEADER_CLASS}>
          {header}
        </h3>
        {body}
      </section>
    );
  }

  return (
    <Collapsible asChild>
      <section aria-labelledby={headingId} className="flex flex-col gap-0.5">
        <h3 id={headingId}>
          <CollapsibleTrigger
            className={cn(
              SECTION_HEADER_CLASS,
              "group/trigger hover:bg-muted transition-colors",
            )}
          >
            {header}
            <ChevronRight
              aria-hidden
              className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-[state=open]/trigger:rotate-90"
            />
          </CollapsibleTrigger>
        </h3>
        <CollapsibleContent>{body}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}

type ProjectNotesProps = {
  projectId: string;
  phases: PhaseRecord[];
  notes: NoteRecord[];
  currentUser: NoteAuthor;
  now: Date;
};

export function ProjectNotes({
  projectId,
  phases,
  notes,
  currentUser,
  now,
}: ProjectNotesProps) {
  return (
    <div className="flex flex-col gap-3.5 pt-4">
      {noteSections(phases, notes).map(({ phase, notes }) => (
        <NotesSection
          key={phase?.id ?? GENERAL_NOTES_HEADING}
          projectId={projectId}
          phase={phase}
          notes={notes}
          currentUser={currentUser}
          now={now}
        />
      ))}
    </div>
  );
}
