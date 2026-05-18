import { requireAdmin } from "@/lib/admin";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getSiteSettings } from "@/lib/settings";

export default async function NewPropertyPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="p-8 w-full space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Property</h1>
        <p className="text-muted-foreground">Create a new listing for the public property catalogue.</p>
      </div>
      <PropertyForm currency={settings.currency} />
    </div>
  );
}
