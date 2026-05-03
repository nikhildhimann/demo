import { requireAdmin } from "@/lib/admin";
import { PropertyForm } from "@/components/admin/PropertyForm";

export default async function NewPropertyPage() {
  await requireAdmin();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Property</h1>
        <p className="text-muted-foreground">Create a new listing for the public property catalogue.</p>
      </div>
      <PropertyForm />
    </div>
  );
}
