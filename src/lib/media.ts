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
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new MediaError("Image size exceeds 15 MB limit.");

  let meta: Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new MediaError("Uploaded file is not a valid image.");
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new MediaError("Supported formats: JPG, PNG, WebP, and HEIC.");
  }
  if ((meta.width ?? 0) < 400 || (meta.height ?? 0) < 300) {
    throw new MediaError("Image is too small — minimum resolution is 400x300 pixels.");
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

/** Removes media rows no longer referenced by any case or site image slot. */
export async function deleteMediaIfUnused(ids: string[]) {
  for (const id of ids) {
    const usedInCase = await prisma.beforeAfterCase.count({ where: { OR: [{ beforeMediaId: id }, { afterMediaId: id }] } });
    const usedInSite = await prisma.siteImage.count({ where: { mediaId: id } });
    const usedInSiteItem = await prisma.siteImageItem.count({ where: { mediaId: id } });
    if (!usedInCase && !usedInSite && !usedInSiteItem) await prisma.media.delete({ where: { id } }).catch(() => undefined);
  }
}
