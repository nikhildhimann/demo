export const siteConfig = {
  brandName: "TOTTO Living",
  tagline: "Modern Property Management & Rentals in Sydney",
  logoText: "TOTTO Living Real Estate",
  phone: "+61 435 938 455",
  whatsapp: "61435938455",
  email: "info@tottoliving.com.au",
  address: "Sydney, Australia",
  mapLocation: "Sydney, Australia",
  siteUrl: "https://tottoliving.com.au/",
  heroTitle: "Modern Property Management & Rentals in Sydney",
  heroSubtitle:
    "Helping property owners manage smarter and tenants find the perfect home.",
  currency: "AUD",
  businessHours: "Mon-Fri 9am to 6pm AEST",
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
  },
  seoTitle: "TOTTO Living | Modern Property Management & Rentals in Sydney",
  seoDescription:
    "Professional property management and rental services in Sydney. Helping property owners maximize returns and tenants find their perfect home.",
  footerCredit: "Designed & Developed for TOTTO Living",
} as const;

export type SiteConfig = typeof siteConfig;
