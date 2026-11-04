import { NOT_FOUND_STATUS } from "@/constants/http";
import { COVER_IMMUTABLE_CACHE_CONTROL } from "@/constants/projectFiles";
import { getCoverImageEffect } from "@/effects/projectCovers";
import { Role } from "@/generated/prisma/enums";
import { protectedEffect } from "@/lib/effect";

const getCoverImage = protectedEffect(getCoverImageEffect, [Role.employee]);

type CoverRouteContext = {
  params: Promise<{ id: string; pieceId: string }>;
};

export async function GET(_request: Request, { params }: CoverRouteContext) {
  const { id, pieceId } = await params;
  const cover = await getCoverImage(id, pieceId);

  if (!cover) {
    return new Response(null, { status: NOT_FOUND_STATUS });
  }

  return new Response(cover.image, {
    headers: {
      "Content-Type": cover.mimeType,
      "Cache-Control": COVER_IMMUTABLE_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
