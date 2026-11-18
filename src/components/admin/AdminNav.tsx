"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, ExternalLink, HelpCircle, Images, LayoutDashboard, ListChecks, Settings, Tag, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/admin/appointments", label: "الحجوزات", icon: ListChecks },
  { href: "/admin/patients", label: "المرضى", icon: Users },
  { href: "/admin/availability", label: "ساعات العمل والتوافر", icon: Clock },
  { href: "/admin/cases", label: "حالات قبل وبعد", icon: Images },
  { href: "/admin/offers", label: "العروض الخاصة", icon: Tag },
  { href: "/admin/faq", label: "الأسئلة الشائعة", icon: HelpCircle },
  { href: "/admin/settings", label: "التواصل والسوشيال", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="لوحة الإدارة" className="mt-6 grid gap-1 text-sm">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${
              active ? "bg-teal-deep font-semibold text-white" : "text-ink hover:bg-ivory"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
      <Link href="/" className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-muted hover:bg-ivory">
        <ExternalLink className="size-4" aria-hidden />
        الموقع العام
      </Link>
    </nav>
  );
}
