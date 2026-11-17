import sharp, { type Metadata } from "sharp";
import { prisma } from "@/lib/prisma";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1800;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "heif", "avif"]);

export class MediaError extends Error {}

/**
 * Decodes an uploaded image (by content, not by the claimed type), applies
 * the EXIF orientation, strips all metadata (incl. GPS), downsizes to
 * MAX_EDGE and stores it as WebP. Returns the new media id and size.
 */
export async function storeImage(buffer: Buffer) {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new MediaError("الصورة أكبر من ١٥ ميجابايت.");

  let meta: Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new MediaError("الملف ليس صورة صالحة.");
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new MediaError("الصيغ المدعومة: JPG وPNG وWebP وHEIC.");
  }
  if ((meta.width ?? 0) < 400 || (meta.height ?? 0) < 300) {
    throw new MediaError("الصورة صغيرة جداً — الحد الأدنى ٤٠٠×٣٠٠ بكسل.");
  }

  const { data, info } = await sharp(buffer)
    .rotate() // honour EXIF orientation, then metadata is dropped by default
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  const media = await prisma.media.create({
    data: { mimeType: "image/webp", width: info.width, height: info.height, sizeBytes: data.byteLength, data },
    select: { id: true, width: true, height: true },
  });
  return media;
}

export const mediaUrl = (id: string) => `/media/${id}`;

/** Removes media rows no longer referenced by any case. */
export async function deleteMediaIfUnused(ids: string[]) {
  for (const id of ids) {
    const used = await prisma.beforeAfterCase.count({ where: { OR: [{ beforeMediaId: id }, { afterMediaId: id }] } });
    if (!used) await prisma.media.delete({ where: { id } }).catch(() => undefined);
  }
}
