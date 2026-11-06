import { FileSections } from "@/components/FileSections";
import type { FileSectionRecord } from "@/lib/projectFiles";

type ProjectFilesSectionProps = {
  projectId: string;
  sections: FileSectionRecord[];
};

export function ProjectFilesSection({
  projectId,
  sections,
}: ProjectFilesSectionProps) {
  return (
    <FileSections
      projectId={projectId}
      pieceId={null}
      sections={sections}
      variant="row"
    />
  );
}
