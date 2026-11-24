import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { CORE_IMAGE_SLOTS } from "@/lib/site-images";
import { getStoredSiteCopy } from "@/lib/site-settings";
import { SiteImageManager } from "@/components/admin/SiteImageManager";
import { SiteCopyForm } from "@/components/admin/SiteCopyForm";
import { SiteDataTabs } from "@/components/admin/SiteDataTabs";

export default async function AdminSiteDataPage() {
  await requireAdminSession();

  const [copyValues, siteImageRows] = await Promise.all([
    getStoredSiteCopy(),
    prisma.siteImage.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const siteImageMap = new Map(siteImageRows.map((row) => [row.id, row]));

  const slots = CORE_IMAGE_SLOTS.map((slot) => {
    const custom = siteImageMap.get(slot.key);
    const items = (custom?.items ?? []).map((it) => ({
      id: it.id,
      mediaId: it.mediaId,
      url: it.mediaId ? `/media/${it.mediaId}` : it.customUrl || "",
      sortOrder: it.sortOrder,
    }));

    const activeUrl =
      items[0]?.url ||
      (custom?.mediaId
        ? `/media/${custom.mediaId}`
        : custom?.customUrl || slot.defaultUrl);

    const isCustom = items.length > 0 || Boolean(custom?.mediaId || custom?.customUrl);

    return {
      ...slot,
      activeUrl,
      isCustom,
      mediaId: custom?.mediaId ?? null,
      items,
      updatedAt: custom?.updatedAt ? custom.updatedAt.toISOString() : null,
    };
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-teal-deep">بيانات الموقع</h1>
        <p className="mt-1 text-sm text-muted">
          إدارة صور الموقع والنصوص الظاهرة للزوار: العناوين، الأوصاف، وسيرة الطبيب.
        </p>
      </div>

      <Suspense>
        <SiteDataTabs
          media={<SiteImageManager slots={slots} />}
          text={<SiteCopyForm values={copyValues} />}
        />
      </Suspense>
    </div>
  );
}
