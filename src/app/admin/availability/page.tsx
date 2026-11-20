import { prisma } from "@/lib/prisma";
import { weekdayLabels } from "@/lib/site";
import { formatCairoDateTime } from "@/lib/datetime";
import { AvailabilityForms } from "@/components/admin/AvailabilityForms";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AvailabilityPage() {
  await requireAdminSession();
  const [settings, hours, blocked, extras] = await Promise.all([
    prisma.availabilitySettings.findUniqueOrThrow({ where: { id: "default" } }),
    prisma.workingHours.findMany({ orderBy: { weekday: "asc" } }),
    prisma.blockedPeriod.findMany({ orderBy: { startsAt: "asc" } }),
    prisma.extraSlot.findMany({ orderBy: { startsAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-teal-deep">Clinic Availability</h1>
      <AvailabilityForms
        settings={settings}
        hours={hours.map((item) => ({
          ...item,
          label: weekdayLabels[item.weekday],
        }))}
        blocked={blocked.map((item) => ({
          id: item.id,
          label: `${formatCairoDateTime(item.startsAt)} → ${formatCairoDateTime(item.endsAt)} — ${item.reason}`,
        }))}
        extras={extras.map((item) => ({
          id: item.id,
          label: `${formatCairoDateTime(item.startsAt)} → ${formatCairoDateTime(item.endsAt)}`,
        }))}
      />
    </div>
  );
}
