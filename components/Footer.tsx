"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Building2, Mail, MapPin, Phone } from "lucide-react";
import type { PublicSiteSettings } from "@/types/settings";

export function Footer({ settings }: { settings: PublicSiteSettings }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const currentYear = new Date().getFullYear();
  const footerLinkClass =
    "group inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
  const footerArrowClass =
    "h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all";
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.displayAddress || settings.businessName)}`;
  const socials = [
    ["Facebook", settings.socialLinks.facebook],
    ["Twitter", settings.socialLinks.twitter],
    ["Instagram", settings.socialLinks.instagram],
    ["LinkedIn", settings.socialLinks.linkedin],
    ["YouTube", settings.socialLinks.youtube],
  ].filter(([, href]) => href);

  return (
    <footer className="border-t border-slate-800 bg-[#070B1A] pt-16 pb-8 text-slate-200">
      <div className="container max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 text-white group">
              <div className="rounded-lg bg-white p-2 text-slate-950 transition-transform group-hover:scale-105">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight transition-colors group-hover:text-amber-200">
                {settings.businessName}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              {settings.defaultSeoDescription || settings.tagline || `${settings.businessName} helps clients find, sell, and rent properties with clear guidance.`}
            </p>
            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {socials.map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                    {label.slice(0, 1)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/" className={footerLinkClass}>Home <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties" className={footerLinkClass}>Properties <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties?status=AVAILABLE" className={footerLinkClass}>Buy <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/sell" className={footerLinkClass}>Sell <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties?status=RENTED" className={footerLinkClass}>Rent <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Contact Us <ArrowUpRight className={footerArrowClass} /></Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Information</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className={footerLinkClass}>About Us <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/privacy-policy" className={footerLinkClass}>Privacy Policy <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/terms" className={footerLinkClass}>Terms & Conditions <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/faq" className={footerLinkClass}>FAQ <ArrowUpRight className={footerArrowClass} /></Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a href={mapHref} target="_blank" rel="noreferrer" className="group flex items-start gap-3 text-slate-300 transition-colors hover:text-white">
                  <MapPin className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="leading-relaxed underline-offset-4 group-hover:underline">{settings.displayAddress || "Office address not configured"}</span>
                </a>
              </li>
              <li>
                <a href={settings.phone ? `tel:${settings.phone}` : "/contact"} className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white">
                  <Phone className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="underline-offset-4 group-hover:underline">{settings.phone || "Phone not configured"}</span>
                </a>
              </li>
              <li>
                <a href={settings.email ? `mailto:${settings.email}` : "/contact"} className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white">
                  <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="underline-offset-4 group-hover:underline">{settings.email || "Email not configured"}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm font-medium text-slate-300">
          <p>&copy; {currentYear} {settings.businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
