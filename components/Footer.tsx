"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Building2, Mail, MapPin, Phone } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { PublicSiteSettings } from "@/types/settings";

type SocialIconProps = SVGProps<SVGSVGElement>;

const socialIcons: Record<"facebook" | "twitter" | "instagram" | "linkedin", ComponentType<SocialIconProps>> = {
  facebook: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.1 8.1V6.3c0-.9.6-1.1 1-1.1h2.6V1.1L14.1 1C10.2 1 9.3 3.9 9.3 5.8v2.3H6v4.5h3.3V23h4.8V12.6h3.5l.5-4.5h-4z" />
    </svg>
  ),
  twitter: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.9 10.5 21.4 2h-1.8l-6.5 7.4L7.9 2H2l7.9 11.2L2 22h1.8l6.9-7.8 5.5 7.8H22l-8.1-11.5zm-2.5 2.8-.8-1.1L4.3 3.3H7l5.1 7.2.8 1.1 6.7 9.3H17l-5.6-7.6z" />
    </svg>
  ),
  instagram: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect width="17.5" height="17.5" x="3.25" y="3.25" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.25" cy="6.75" r="1.15" fill="currentColor" />
    </svg>
  ),
  linkedin: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.4 8.6H1.7V22h3.7V8.6zM3.5 2C2.3 2 1.4 2.9 1.4 4.1s.9 2.1 2.1 2.1 2.1-.9 2.1-2.1S4.7 2 3.5 2zm7.5 6.6H7.4V22H11v-6.6c0-1.7.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V22h3.7v-7.4c0-3.6-.8-6.4-5-6.4-2 0-3.3 1.1-3.9 2.1H11V8.6z" />
    </svg>
  ),
};

export function Footer({ settings }: { settings: PublicSiteSettings }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const currentYear = new Date().getFullYear();
  const footerLinkClass =
    "group inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
  const footerArrowClass =
    "h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all";
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.displayAddress || settings.businessName)}`;
  
  const socialConfig = [
    { label: "Facebook", href: settings.socialLinks?.facebook, icon: socialIcons.facebook },
    { label: "Twitter", href: settings.socialLinks?.twitter, icon: socialIcons.twitter },
    { label: "Instagram", href: settings.socialLinks?.instagram, icon: socialIcons.instagram },
    { label: "LinkedIn", href: settings.socialLinks?.linkedin, icon: socialIcons.linkedin },
  ];

  const socials = socialConfig.filter(social => social.href);

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
                {socials.map(({ label, href, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                    <Icon className="h-5 w-5" />
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
              <li><Link href="/properties?purpose=RENT&status=AVAILABLE" className={footerLinkClass}>Rent <ArrowUpRight className={footerArrowClass} /></Link></li>
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
