"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Building2, Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/data/siteConfig";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const currentYear = new Date().getFullYear();
  const footerLinkClass =
    "group inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
  const footerArrowClass =
    "h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all";
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`;

  return (
    <footer className="border-t border-slate-800 bg-[#070B1A] pt-16 pb-8 text-slate-200">
      <div className="container max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & Description */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 text-white group">
              <div className="p-2 rounded-lg bg-white text-slate-950 transition-transform group-hover:scale-105">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight transition-colors group-hover:text-amber-200">
                {siteConfig.logoText}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              TOTTO Living provides professional property management and rental services in Sydney, helping property owners maximize returns and tenants find their perfect home.
            </p>
            <div className="flex items-center gap-4">
              <a href={siteConfig.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={siteConfig.socialLinks.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href={siteConfig.socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 transition-all hover:-translate-y-1 hover:bg-white hover:text-slate-950">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/" className={footerLinkClass}>Home <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties" className={footerLinkClass}>Properties <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties?status=AVAILABLE" className={footerLinkClass}>Buy <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Sell <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/properties?status=AVAILABLE&type=APARTMENT" className={footerLinkClass}>Rent <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Contact Us <ArrowUpRight className={footerArrowClass} /></Link></li>
            </ul>
          </div>

          {/* Legal/Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Information</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className={footerLinkClass}>About Us <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/privacy-policy" className={footerLinkClass}>Privacy Policy <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/terms" className={footerLinkClass}>Terms & Conditions <ArrowUpRight className={footerArrowClass} /></Link></li>
              <li><Link href="/faq" className={footerLinkClass}>FAQ <ArrowUpRight className={footerArrowClass} /></Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a href={mapHref} target="_blank" rel="noreferrer" className="group flex items-start gap-3 text-slate-300 transition-colors hover:text-white">
                <MapPin className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="leading-relaxed underline-offset-4 group-hover:underline">{siteConfig.address}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${siteConfig.phone}`} className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white">
                <Phone className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="underline-offset-4 group-hover:underline">{siteConfig.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white">
                <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="underline-offset-4 group-hover:underline">{siteConfig.email}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm font-medium text-slate-300">
          <p>&copy; {currentYear} {siteConfig.brandName}. All rights reserved.</p>
          <p className="mt-2">{siteConfig.footerCredit}</p>
        </div>
      </div>
    </footer>
  );
}
