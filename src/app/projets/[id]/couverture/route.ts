import { COVER_CACHE_CONTROL, NOT_FOUND_STATUS } from "@/constants/projectHome";
import { getProjectCoverImageEffect } from "@/effects/projectHome";
import { Role } from "@/generated/prisma/enums";
import { protectedEffect } from "@/lib/effect";

const getCoverImage = protectedEffect(getProjectCoverImageEffect, [
  Role.employee,
]);

type CoverRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: CoverRouteContext) {
  const { id } = await params;
  const image = await getCoverImage(id);

  if (!image) {
    return new Response(null, { status: NOT_FOUND_STATUS });
  }

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": COVER_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
