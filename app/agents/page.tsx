import { getSiteSettings } from "@/lib/settings";
import { AgentsClient } from "./AgentsClient";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const settings = await getSiteSettings();
  return <AgentsClient settings={settings} />;
}
