import { SiteSettingsForm, type SiteSettingsValues } from "@/components/admin/SiteSettingsForm";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  await requireAdminSession();
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const values: SiteSettingsValues = {
    phone: row?.phone ?? "",
    whatsapp: row?.whatsapp ?? "",
    email: row?.email ?? "",
    address: row?.address ?? "",
    mapsUrl: row?.mapsUrl ?? "",
    instagram: row?.instagram ?? "",
    facebook: row?.facebook ?? "",
    tiktok: row?.tiktok ?? "",
    youtube: row?.youtube ?? "",
    x: row?.x ?? "",
    snapchat: row?.snapchat ?? "",
  };
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-teal-deep">التواصل والسوشيال</h1>
      <SiteSettingsForm values={values} />
    </div>
  );
}
