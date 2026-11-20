"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  ListChecks,
  Settings,
  Stethoscope,
  Tag,
  Users,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/appointments", label: "Appointments", icon: ListChecks },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/treatments", label: "Treatments & Services", icon: Stethoscope },
  { href: "/admin/images", label: "Site Images", icon: ImageIcon },
  { href: "/admin/availability", label: "Hours & Availability", icon: Clock },
  { href: "/admin/cases", label: "Before & After", icon: Images },
  { href: "/admin/offers", label: "Special Offers", icon: Tag },
  { href: "/admin/faq", label: "FAQs", icon: HelpCircle },
  { href: "/admin/settings", label: "Contact & Social", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin Navigation" className="mt-6 grid gap-1 text-sm">
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
        Public Website
      </Link>
    </nav>
  );
}
