import { NextRequest } from "next/server";

import {
  FILE_THUMBNAIL_TILE_SIZE,
  THUMBNAIL_CACHE_CONTROL,
} from "@/constants/dropbox";
import { NOT_FOUND_STATUS } from "@/constants/http";
import {
  FILE_THUMBNAIL_PARAM,
  FILE_THUMBNAIL_SIZE_PARAM,
} from "@/constants/projectFiles";
import { getFileThumbnailEffect } from "@/effects/projectFiles";
import { Role } from "@/generated/prisma/enums";
import { protectedEffect } from "@/lib/effect";

const getThumbnail = protectedEffect(getFileThumbnailEffect, [Role.employee]);

type FilesRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: FilesRouteContext) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const fileId = searchParams.get(FILE_THUMBNAIL_PARAM);
  const size =
    searchParams.get(FILE_THUMBNAIL_SIZE_PARAM) ?? FILE_THUMBNAIL_TILE_SIZE;

  if (!fileId) {
    return new Response(null, { status: NOT_FOUND_STATUS });
  }

  const thumbnail = await getThumbnail(id, fileId, size);

  if (!thumbnail) {
    return new Response(null, { status: NOT_FOUND_STATUS });
  }

  return new Response(thumbnail.bytes, {
    headers: {
      "Content-Type": thumbnail.contentType,
      "Cache-Control": THUMBNAIL_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
