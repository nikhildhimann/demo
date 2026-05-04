"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeDollarSign, Building2, ChevronDown, ChevronRight, Home, KeyRound, Menu, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicSiteSettings } from "@/types/settings";

const desktopNavLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const propertyMenuItems = [
  { name: "Buy Property", href: "/properties?status=AVAILABLE", icon: Home },
  { name: "Rent Property", href: "/properties?status=RENTED", icon: KeyRound },
  { name: "Sell Property", href: "/sell", icon: BadgeDollarSign },
];

const propertyListingItems = [
  { name: "All Properties", href: "/properties", icon: Home },
  { name: "Featured Properties", href: "/properties?favorites=true", icon: Star },
];

export function Navbar({ settings }: { settings: PublicSiteSettings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) setIsDesktopDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsDesktopDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobilePropertiesOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const whatsappCta = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent("Hi, I am interested in your real estate services.")}`
    : "";
  const isPropertiesActive = pathname.startsWith("/properties") || pathname === "/sell";
  const isLinkActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-slate-200 bg-white py-3 shadow-lg shadow-slate-900/5"
          : "border-b border-slate-200 bg-white py-4 shadow-sm"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" scroll={true} className="flex min-w-0 items-center gap-2 group">
          <motion.div whileHover={{ rotate: 10 }} className="rounded-lg bg-slate-900 p-2 text-white transition-colors">
            <Building2 className="w-6 h-6" />
          </motion.div>
          <span className="truncate text-xl font-bold tracking-tight text-slate-950">
            {settings.businessName}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {desktopNavLinks.slice(0, 1).map((link) => (
            <Link
              key={link.name}
              href={link.href}
              scroll={true}
              className={cn(
                "group relative rounded-full px-1 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4",
                "text-slate-700 hover:text-slate-950",
                isLinkActive(link.href) && "text-slate-950"
              )}
            >
              {link.name}
              <span className={cn("absolute -bottom-1 left-0 h-0.5 bg-emerald-500 transition-all duration-200 group-hover:w-full", isLinkActive(link.href) ? "w-full" : "w-0")} />
            </Link>
          ))}

          <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={() => setIsDesktopDropdownOpen(true)}
            onMouseLeave={() => setIsDesktopDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsDesktopDropdownOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1 rounded-full px-1 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4",
                "text-slate-700 hover:text-slate-950",
                isPropertiesActive && "text-slate-950"
              )}
            >
              Properties
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isDesktopDropdownOpen ? "rotate-180" : "rotate-0")} />
            </button>

            <AnimatePresence>
              {isDesktopDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-1/2 top-10 w-80 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
                >
                  {[propertyMenuItems, propertyListingItems].map((group, index) => (
                    <div key={index} className={cn("space-y-1", index === 1 && "mt-2 border-t border-slate-200 pt-2")}>
                      {group.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            scroll={true}
                            onClick={() => setIsDesktopDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            <Icon className="h-4 w-4 text-slate-500" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {desktopNavLinks.slice(1).map((link) => (
            <Link
              key={link.name}
              href={link.href}
              scroll={true}
              className={cn(
                "group relative rounded-full px-1 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4",
                "text-slate-700 hover:text-slate-950",
                isLinkActive(link.href) && "text-slate-950"
              )}
            >
              {link.name}
              <span className={cn("absolute -bottom-1 left-0 h-0.5 bg-emerald-500 transition-all duration-200 group-hover:w-full", isLinkActive(link.href) ? "w-full" : "w-0")} />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          {whatsappCta && (
            <Button className="h-10 rounded-full bg-emerald-600 px-5 font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500/40" asChild>
              <a href={whatsappCta} target="_blank" rel="noreferrer">
                Talk on WhatsApp
              </a>
            </Button>
          )}
        </div>

        <button
          className="rounded-md border border-slate-200 bg-white p-2 text-slate-950 shadow-sm transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-white shadow-2xl"
          >
            <div className="flex h-[100dvh] flex-col px-4 py-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="rounded-lg bg-primary p-2 text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="truncate text-lg font-bold text-slate-900">
                    {settings.businessName}
                  </span>
                </div>
                <button
                  className="rounded-full p-3 text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                <Link href="/" scroll={true} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-4 text-base font-medium text-slate-800 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                  Home
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMobilePropertiesOpen((prev) => !prev)}
                  className="flex items-center justify-between rounded-lg px-4 py-4 text-left text-base font-medium text-slate-800 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Properties
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isMobilePropertiesOpen ? "rotate-180" : "rotate-0")} />
                </button>

                <AnimatePresence initial={false}>
                  {isMobilePropertiesOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="ml-3 space-y-1 border-l-2 border-slate-200 bg-white pl-4">
                        {[...propertyMenuItems, ...propertyListingItems].map((item) => (
                          <Link key={item.name} href={item.href} scroll={true} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                            {item.name}
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {desktopNavLinks.slice(1).map((link) => (
                  <Link key={link.name} href={link.href} scroll={true} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-4 text-base font-medium text-slate-800 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    {link.name}
                  </Link>
                ))}
              </nav>

              {whatsappCta && (
                <div className="mt-auto flex flex-col gap-3 pt-4">
                  <Button className="h-14 w-full rounded-full text-base font-semibold shadow-lg" asChild>
                    <a href={whatsappCta} target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)}>
                      Talk on WhatsApp
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
