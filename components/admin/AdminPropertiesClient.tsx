"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Edit, ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { PublicSiteSettings } from "@/types/settings";

type AdminProperty = {
  id: string;
  title: string;
  slug: string;
  price: number;
  city: string;
  type: string;
  purpose: string;
  status: string;
  featured: boolean;
  deletedAt: Date | string | null;
  images: { url: string }[];
  updatedAt: Date | string;
};

const propertyStatuses = ["AVAILABLE", "SOLD", "RENTED", "DRAFT"];
const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL", "LAND", "PLOT"];
const propertyPurposes = ["BUY", "RENT", "SELL"];

export function AdminPropertiesClient({ properties, settings }: { properties: AdminProperty[]; settings: PublicSiteSettings }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [purposeFilter, setPurposeFilter] = useState(searchParams.get("purpose") || "all");
  const [featuredFilter, setFeaturedFilter] = useState(searchParams.get("featured") === "true" ? "true" : "all");
  const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
    setTypeFilter(searchParams.get("type") || "all");
    setPurposeFilter(searchParams.get("purpose") || "all");
    setFeaturedFilter(searchParams.get("featured") === "true" ? "true" : "all");
  }, [searchParams]);

  const handleFilterChange = (key: "status" | "type" | "purpose" | "featured", value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "type") setTypeFilter(value);
    if (key === "purpose") setPurposeFilter(value);
    if (key === "featured") setFeaturedFilter(value);

    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/properties?${params.toString()}`);
  };

  const softDelete = async (id: string) => {
    if (!confirm("Soft delete this property? It will be hidden from the public site.")) return;
    if (pendingPropertyId) return;

    setPendingPropertyId(id);
    try {
      const response = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Property deleted");
        router.refresh();
      } else {
        toast.error("Unable to delete property");
      }
    } finally {
      setPendingPropertyId(null);
    }
  };

  const updateQuick = async (property: AdminProperty, data: { status?: string; featured?: boolean }) => {
    if (pendingPropertyId) return;

    const nextStatus = data.status || property.status;
    if (data.featured === true && nextStatus !== "AVAILABLE") {
      toast.error("Only available properties can be featured.");
      return;
    }

    setPendingPropertyId(property.id);
    try {
      const response = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success(nextStatus !== "AVAILABLE" && property.featured ? "Property updated and removed from featured" : "Property updated");
        router.refresh();
        return;
      }
      const error = await response.json().catch(() => null);
      toast.error(error?.error || "Unable to update property");
    } finally {
      setPendingPropertyId(null);
    }
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
      const matchesType = typeFilter === "all" || property.type === typeFilter;
      const matchesPurpose = purposeFilter === "all" || property.purpose === purposeFilter;
      const matchesFeatured = featuredFilter === "all" || property.featured;
      return matchesQuery && matchesStatus && matchesType && matchesPurpose && matchesFeatured;
    });
  }, [properties, query, statusFilter, typeFilter, purposeFilter, featuredFilter]);

  return (
    <div className="w-full min-h-screen space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage listings for {settings.businessName}.</p>
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
          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            {["all", ...propertyStatuses].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                className="h-8 flex-none px-3 text-xs sm:text-sm"
                onClick={() => handleFilterChange("status", status)}
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40 sm:text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={purposeFilter} onValueChange={(value) => handleFilterChange("purpose", value)}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-36 sm:text-sm">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {propertyPurposes.map((purpose) => <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={featuredFilter === "true" ? "default" : "outline"}
              size="sm"
              className="h-8 flex-none px-3 text-xs sm:text-sm"
              onClick={() => handleFilterChange("featured", featuredFilter === "true" ? "all" : "true")}
            >
              Featured
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No properties yet. Add your first listing to publish the site.</Card>
        ) : filtered.map((property) => (
          <Card key={property.id} className="flex min-w-0 flex-col gap-4 p-4 md:flex-row md:items-center">
            {(() => {
              const isPending = pendingPropertyId === property.id;
              return (
                <>
            <div className="relative h-28 w-full md:w-40 rounded-lg overflow-hidden bg-muted shrink-0">
              {property.images[0]?.url ? (
                <Image src={property.images[0].url} alt={property.title} fill className="object-cover" unoptimized />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="min-w-0 flex-1 basis-full truncate text-xl font-bold sm:basis-auto">{property.title}</h2>
                {property.featured && <Badge className="bg-yellow-500"><Star className="h-3 w-3 mr-1 fill-current" /> Featured</Badge>}
                {property.deletedAt && <Badge variant="destructive">Deleted</Badge>}
                <Badge variant="outline">{property.status}</Badge>
                <Badge variant="secondary">{property.type}</Badge>
                <Badge variant="secondary">{property.purpose}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{property.city} · {formatPrice(property.price, settings.currency)}</p>
              <p className="text-xs text-muted-foreground mt-1">/{property.slug}</p>
            </div>
            <div className="flex w-full min-w-0 flex-wrap gap-2 md:w-auto md:max-w-md md:justify-end">
              <Button
                variant={property.featured ? "default" : "outline"}
                size="sm"
                className="h-8 flex-none px-3 text-xs sm:text-sm"
                disabled={isPending}
                onClick={() => updateQuick(property, { featured: !property.featured })}
              >
                <Star className="mr-2 h-4 w-4" />
                {property.featured ? "Unfeature" : "Feature"}
              </Button>
              {propertyStatuses.map((status) => (
                <Button
                  key={status}
                  variant={property.status === status ? "default" : "outline"}
                  size="sm"
                  className="h-8 flex-none px-3 text-xs sm:text-sm"
                  disabled={isPending}
                  onClick={() => updateQuick(property, { status })}
                >
                  {status}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-8 flex-none px-3 text-xs sm:text-sm" asChild>
                <Link href={`/properties/${property.slug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8 flex-none px-3 text-xs sm:text-sm" asChild>
                <Link href={`/admin/properties/${property.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" className="h-8 flex-none px-3 text-xs sm:text-sm" disabled={isPending} onClick={() => softDelete(property.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
                </>
              );
            })()}
          </Card>
        ))}
      </div>
    </div>
  );
}
