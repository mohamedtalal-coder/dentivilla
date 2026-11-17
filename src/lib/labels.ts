import type { AppointmentStatus } from "@prisma/client";

export const statusLabel: Record<AppointmentStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكد",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
};
