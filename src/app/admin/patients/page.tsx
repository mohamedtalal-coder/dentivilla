import Link from "next/link";
import { ArrowLeft, CalendarCheck, Lock, Phone, Search, Shield, User, X } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatCairoDateTime } from "@/lib/datetime";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // 1. Restrict access strictly to authorized admin sessions
  await requireAdminSession();

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  // 2. Search by name or phone
  const where: Prisma.PatientWhereInput = query
    ? {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const [patients, totalCount] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { startsAt: "desc" },
          take: 1,
          select: { startsAt: true, status: true, treatment: { select: { nameAr: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.patient.count(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-deep">سجلات المرضى</h1>
          <p className="mt-1 text-sm text-muted">
            إدارة سجلات المرضى والبحث بالاسم أو رقم الهاتف، مع حماية خصوصية البيانات.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-light px-3 py-1 text-xs font-semibold text-teal-deep">
          <Lock className="size-3" aria-hidden />
          منطقة مصرح بها فقط
        </span>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal-light/50 p-4 text-sm text-teal-deep">
        <Shield className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-bold">حماية خصوصية بيانات المرضى</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            تقتصر بيانات المريض المحفوظة نظامياً على الاسم ورقم الهاتف والحجوزات المرتبطة به فقط. لا يتم تخزين أي ملاحظات
            أو بيانات إضافية.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-soft rounded-2xl p-4 sm:p-5">
        <form method="GET" action="/admin/patients" className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="ابحث باسم المريض أو رقم الهاتف..."
              className="field pe-10 ps-4 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-2.5 text-sm">
            <span>بحث</span>
          </button>
          {query && (
            <Link
              href="/admin/patients"
              className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <X className="size-4" aria-hidden />
              <span>إلغاء البحث</span>
            </Link>
          )}
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            {query ? `نتائج البحث عن "${query}": ${patients.length} مريض` : `إجمالي المرضى المسجلين: ${totalCount}`}
          </span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card-soft overflow-hidden rounded-[24px]">
        {patients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right text-sm">
              <thead className="border-b border-line bg-ivory text-xs font-bold text-teal-deep uppercase">
                <tr>
                  <th className="p-4">اسم المريض</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4 text-center">عدد الحجوزات</th>
                  <th className="p-4">آخر موعد</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {patients.map((patient) => {
                  const latest = patient.appointments[0];
                  return (
                    <tr key={patient.id} className="transition-colors hover:bg-teal-light/20">
                      <td className="p-4 font-bold text-teal-deep">
                        <Link href={`/admin/patients/${patient.id}`} className="hover:underline">
                          {patient.fullName}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span dir="ltr" className="inline-flex items-center gap-1.5 font-mono text-ink">
                          <Phone className="size-3.5 text-muted" aria-hidden />
                          {patient.phone}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-0.5 font-semibold text-teal-deep">
                          <CalendarCheck className="size-3 text-teal" aria-hidden />
                          {patient._count.appointments}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted">
                        {latest ? (
                          <div>
                            <span className="block font-medium text-ink">
                              {latest.treatment.nameAr}
                            </span>
                            <span className="mt-0.5 block text-muted">
                              {formatCairoDateTime(latest.startsAt)} ({statusLabel[latest.status]})
                            </span>
                          </div>
                        ) : (
                          <span>لا توجد مواعيد</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/admin/patients/${patient.id}`}
                          className="btn-secondary px-3.5 py-1.5 text-xs font-semibold hover:border-teal"
                        >
                          <span>عرض وتعديل</span>
                          <ArrowLeft className="size-3.5" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-muted">
            <User className="mx-auto size-12 text-neutral-300" aria-hidden />
            <p className="mt-3 text-base font-semibold text-ink">
              {query ? `لم يتم العثور على أي مريض يطابق "${query}"` : "لا يوجد مرضى مسجلون حالياً"}
            </p>
            {query && (
              <div className="mt-4">
                <Link href="/admin/patients" className="btn-secondary text-xs">
                  مسح البحث وعرض كل المرضى
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
