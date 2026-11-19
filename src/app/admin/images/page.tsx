import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { CORE_IMAGE_SLOTS } from "@/lib/site-images";
import { SiteImageManager } from "@/components/admin/SiteImageManager";

export default async function AdminSiteImagesPage() {
  await requireAdminSession();

  const siteImageRows = await prisma.siteImage.findMany();
  const siteImageMap = new Map(siteImageRows.map((row) => [row.id, row]));

  const slots = CORE_IMAGE_SLOTS.map((slot) => {
    const custom = siteImageMap.get(slot.key);
    const activeUrl = custom?.mediaId
      ? `/media/${custom.mediaId}`
      : custom?.customUrl || slot.defaultUrl;

    return {
      ...slot,
      activeUrl,
      isCustom: Boolean(custom?.mediaId || custom?.customUrl),
      mediaId: custom?.mediaId ?? null,
      updatedAt: custom?.updatedAt ? custom.updatedAt.toISOString() : null,
    };
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-teal-deep">الصور الرئيسية للموقع</h1>
        <p className="mt-1 text-sm text-muted">
          تعديل واستبدال صور واجهة الموقع الرئيسية (الشعار، صورة الطبيب، كارت الفلسفة) والتحكم في ظهورها.
        </p>
      </div>
      <SiteImageManager slots={slots} />
    </div>
  );
}
