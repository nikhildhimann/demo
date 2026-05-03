"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AIPropertyAssistant = dynamic(() => import("@/components/AIPropertyAssistant"), {
  ssr: false,
});

export function AssistantLoader() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return <AIPropertyAssistant />;
}
