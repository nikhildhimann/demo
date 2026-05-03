"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/data/siteConfig";

type AdminProperty = {
  id: string;
  title: string;
  slug: string;
  price: number;
  city: string;
  type: string;
  status: string;
  featured: boolean;
  deletedAt: Date | string | null;
  images: { url: string }[];
  updatedAt: Date | string;
};

export function AdminPropertiesClient({ properties }: { properties: AdminProperty[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const softDelete = async (id: string) => {
    if (!confirm("Soft delete this property? It will be hidden from the public site.")) return;
    const response = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Property deleted");
      router.refresh();
    } else {
      toast.error("Unable to delete property");
    }
  };

  const updateQuick = async (id: string, data: { status?: string; featured?: boolean }) => {
    const response = await fetch(`/api/admin/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      toast.success("Property updated");
      router.refresh();
      return;
    }
    toast.error("Unable to update property");
  };

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        property.title.toLowerCase().includes(q) ||
        property.city.toLowerCase().includes(q) ||
        property.slug.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [properties, query, statusFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage listings for {siteConfig.brandName}.</p>
        </div>
        <Button asChild>
          <Link href="/admin/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search properties..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            {["all", "AVAILABLE", "SOLD", "RENTED", "DRAFT"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No properties yet. Add your first listing to publish the site.</Card>
        ) : filtered.map((property) => (
          <Card key={property.id} className="p-4 flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative h-28 w-full md:w-40 rounded-lg overflow-hidden bg-muted shrink-0">
              {property.images[0]?.url ? (
                <Image src={property.images[0].url} alt={property.title} fill className="object-cover" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="font-bold text-xl truncate">{property.title}</h2>
                {property.featured && <Badge className="bg-yellow-500"><Star className="h-3 w-3 mr-1 fill-current" /> Featured</Badge>}
                {property.deletedAt && <Badge variant="destructive">Deleted</Badge>}
                <Badge variant="outline">{property.status}</Badge>
                <Badge variant="secondary">{property.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{property.city} · {formatPrice(property.price, siteConfig.currency)}</p>
              <p className="text-xs text-muted-foreground mt-1">/{property.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                variant={property.featured ? "default" : "outline"}
                size="sm"
                onClick={() => updateQuick(property.id, { featured: !property.featured })}
              >
                <Star className="mr-2 h-4 w-4" />
                {property.featured ? "Unfeature" : "Feature"}
              </Button>
              {["AVAILABLE", "SOLD", "RENTED", "DRAFT"].map((status) => (
                <Button
                  key={status}
                  variant={property.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQuick(property.id, { status })}
                >
                  {status}
                </Button>
              ))}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${property.slug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/properties/${property.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => softDelete(property.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
