import {
  coverFramingStyle,
  coverImageUrl,
  type CoverFraming,
} from "@/lib/projectFiles";
import { cn } from "@/lib/utils";

type CoverImageProps = {
  projectId: string;
  pieceId: number;
  version: Date;
  framing: CoverFraming;
  className?: string;
};

export function CoverImage({
  projectId,
  pieceId,
  version,
  framing,
  className,
}: CoverImageProps) {
  return (
    <img
      src={coverImageUrl(projectId, pieceId, version)}
      alt=""
      loading="lazy"
      draggable={false}
      style={coverFramingStyle(framing)}
      className={cn(
        "size-full origin-(--cover-position) scale-(--cover-zoom) object-cover object-(--cover-position) select-none",
        className,
      )}
    />
  );
}
