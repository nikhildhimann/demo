import { requireAdmin } from "@/lib/admin";
import { SettingsClient } from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return <SettingsClient />;
}
