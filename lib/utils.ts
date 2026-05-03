import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatPrice(price: number, currency: string = "AUD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function generateSlug(title: string) {
  return `${slugify(title)}-${Math.random().toString(36).substring(2, 7)}`;
}
