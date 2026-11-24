"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { site } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/treatments", label: "Treatments" },
  { href: "/about", label: "About Doctor" },
  { href: "/cases", label: "Before & After" },
  { href: "/contact", label: "Contact" },
];

export function Header({
  logoUrl,
  doctorName = site.doctor.name,
  doctorTitle = site.doctor.title,
  doctorSubtitle = site.doctor.subtitle,
}: {
  logoUrl?: string;
  doctorName?: string;
  doctorTitle?: string;
  doctorSubtitle?: string;
} = {}) {
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-2.5 z-50 px-2.5 sm:top-4 sm:px-6">
      <nav
        aria-label="Main Navigation"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 rounded-full border bg-white/90 py-1.5 sm:py-2 ps-2.5 pe-1.5 sm:ps-5 sm:pe-2 backdrop-blur-md transition-shadow ${
          scrolled ? "border-line shadow-card" : "border-white/60"
        }`}
      >
        <Link href="/" className="shrink-0 rounded-full" aria-label="Dentivilla — Home">
          <Logo src={logoUrl} doctorName={doctorName} subtitle={doctorSubtitle} />
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/booking/status"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-teal-light hover:text-teal-deep"
          >
            Check Status
          </Link>
          <Link
            href="/booking"
            className="btn-primary px-3 py-2 text-xs whitespace-nowrap sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <CalendarCheck className="size-3.5 sm:size-4" aria-hidden />
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Book Appointment</span>
          </Link>
          <button
            type="button"
            className="grid size-9 sm:size-10 place-items-center rounded-full text-teal-deep transition-colors hover:bg-teal-light lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
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
          <div className="mb-2 rounded-2xl bg-teal-light/50 p-3 text-xs border border-teal-light/70">
            <p className="font-semibold text-teal-deep">{doctorName}</p>
            <p className="text-muted">{doctorTitle}</p>
          </div>
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
                Check Existing Booking
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
