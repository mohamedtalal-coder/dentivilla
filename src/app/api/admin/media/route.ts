import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAX_UPLOAD_BYTES, MediaError, mediaUrl, storeImage } from "@/lib/media";

export const dynamic = "force-dynamic";

/** POST /api/admin/media (multipart, field "file") — admin-only image upload. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "انتهت الجلسة. سجّل الدخول مرة أخرى." }, { status: 401 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "الصورة أكبر من ١٥ ميجابايت." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "طلب رفع غير صالح." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "اختر صورة." }, { status: 400 });

  try {
    const media = await storeImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ...media, url: mediaUrl(media.id) }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaError) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error("media upload failed", error);
    return NextResponse.json({ error: "تعذر معالجة الصورة." }, { status: 500 });
  }
}
