import { UPLOAD_CONTENT_TYPE } from "@/constants/projectFiles";

export async function postFileToLink(link: string, file: File): Promise<void> {
  const response = await fetch(link, {
    method: "POST",
    headers: { "Content-Type": UPLOAD_CONTENT_TYPE },
    body: file,
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}
