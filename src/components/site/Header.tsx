"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const navLinks = [
  { href: "/#about", label: "عن العيادة" },
  { href: "/#concerns", label: "احتياجك" },
  { href: "/treatments", label: "العلاجات" },
  { href: "/#results", label: "قبل وبعد" },
  { href: "/education", label: "تعرّف على أسنانك" },
  { href: "/contact", label: "تواصل" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => !href.startsWith("/#") && pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <nav
        aria-label="التنقل الرئيسي"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border bg-white/90 py-2 ps-3 pe-2 backdrop-blur-md transition-shadow sm:ps-5 ${
          scrolled ? "border-line shadow-card" : "border-white/60"
        }`}
      >
        <Link href="/" className="shrink-0 rounded-full" aria-label="Dentivilla — الصفحة الرئيسية">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 text-sm text-neutral-600 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="rounded-full px-3 py-2 transition-colors hover:text-teal-deep aria-[current=page]:font-semibold aria-[current=page]:text-teal-deep"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Link
            href="/booking/status"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-teal-light hover:text-teal-deep"
          >
            متابعة طلب الحجز
          </Link>
          <Link href="/booking" className="btn-primary px-4 py-2.5 whitespace-nowrap sm:px-5">
            <CalendarCheck className="size-4" aria-hidden />
            <span className="sm:hidden">احجز</span>
            <span className="hidden sm:inline">احجز موعداً</span>
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-teal-deep transition-colors hover:bg-teal-light lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="mx-auto mt-2 max-w-7xl animate-fade-in rounded-3xl border border-line bg-white p-3 shadow-lift lg:hidden"
        >
          <ul className="grid gap-1 text-base">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 font-medium text-ink transition-colors hover:bg-teal-light hover:text-teal-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-2">
              <Link
                href="/booking/status"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-muted hover:bg-teal-light"
              >
                متابعة طلب حجز سابق
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
