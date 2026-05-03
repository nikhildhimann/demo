import { requireAdmin } from "@/lib/admin";
import { EnquiriesClient } from "@/components/admin/EnquiriesClient";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  return <EnquiriesClient />;
}
