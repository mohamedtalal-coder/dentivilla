import { prisma } from "@/lib/prisma";

/** GET /media/:id — serves an uploaded image. Ids are immutable, so responses cache forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/i.test(id)) return new Response("Not found", { status: 404 });

  const media = await prisma.media.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
