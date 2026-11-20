import type { AppointmentStatus } from "@prisma/client";

export const statusLabel: Record<AppointmentStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكد",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
};

export const statusLabelEn: Record<AppointmentStatus, string> = {
  PENDING: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
