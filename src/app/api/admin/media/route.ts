import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAX_UPLOAD_BYTES, MediaError, mediaUrl, storeImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/** POST /api/admin/media (multipart, field "file") — admin-only image upload. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Image exceeds 15 MB limit." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Please select an image file." }, { status: 400 });

  try {
    const media = await storeImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ...media, url: mediaUrl(media.id) }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaError) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error("media upload failed", error);
    return NextResponse.json({ error: "Could not process image." }, { status: 500 });
  }
}
