"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { PublicSiteSettings } from "@/types/settings";

const AIPropertyAssistant = dynamic(() => import("@/components/AIPropertyAssistant"), {
  ssr: false,
});

export function AssistantLoader({ settings }: { settings: PublicSiteSettings }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return <AIPropertyAssistant settings={settings} />;
}
