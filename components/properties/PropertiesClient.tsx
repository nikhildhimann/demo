"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PropertyCardData } from "@/lib/property-data";
import { siteConfig } from "@/data/siteConfig";
import { PremiumPropertyCard } from "@/components/property/PremiumPropertyCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, MapPin, Home, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PropertiesClient({
  initialProperties,
  initialFilters = {},
}: {
  initialProperties: PropertyCardData[];
  initialFilters?: Partial<{
    search: string;
    location: string;
    type: string;
    status: string;
    min: string;
    max: string;
    bedrooms: string;
    featured: string;
    favorites: string;
    sort: string;
  }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    location: initialFilters.location || "",
    type: initialFilters.type || "",
    status: initialFilters.status || "",
    min: initialFilters.min || "",
    max: initialFilters.max || "",
    bedrooms: initialFilters.bedrooms || "",
    featured: initialFilters.featured || "",
    favorites: initialFilters.favorites || "",
  });
  const [sortBy, setSortBy] = useState(initialFilters.sort || "latest");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<PropertyCardData[]>([]);

  useEffect(() => {
    setFilters({
      search: initialFilters.search || "",
      location: initialFilters.location || "",
      type: initialFilters.type || "",
      status: initialFilters.status || "",
      min: initialFilters.min || "",
      max: initialFilters.max || "",
      bedrooms: initialFilters.bedrooms || "",
      featured: initialFilters.featured || "",
      favorites: initialFilters.favorites || "",
    });
    setSortBy(initialFilters.sort || "latest");
  }, [
    initialFilters.search,
    initialFilters.location,
    initialFilters.type,
    initialFilters.status,
    initialFilters.min,
    initialFilters.max,
    initialFilters.bedrooms,
    initialFilters.featured,
    initialFilters.favorites,
    initialFilters.sort,
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("elite_wishlist");
      if (!saved) return;
      const parsed = JSON.parse(saved) as Array<Partial<PropertyCardData> & { id?: string }>;
      const ids = parsed.map((item) => item.id).filter((id): id is string => Boolean(id));
      setFavoriteIds(ids);
      setFavoriteProperties(
        parsed
          .filter((item): item is Partial<PropertyCardData> & { id: string } => Boolean(item.id))
          .map((item) => ({
            id: item.id,
            title: item.title || "Property",
            slug: item.slug || "",
            address: item.address || "",
            price: Number(item.price || 0),
            bedrooms: Number(item.bedrooms || 0),
            bathrooms: Number(item.bathrooms || 0),
            area: Number(item.area || 0),
            image: item.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800",
            status: item.status || "AVAILABLE",
            type: item.type || "PROPERTY",
          }))
      );
    } catch {
      setFavoriteIds([]);
      setFavoriteProperties([]);
    }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", location: "", type: "", status: "", min: "", max: "", bedrooms: "", featured: "", favorites: "" });
    setSortBy("latest");
    router.push(pathname);
  };

  const applyFilters = (nextSort = sortBy) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (nextSort && nextSort !== "latest") params.set("sort", nextSort);
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    setIsMobileFiltersOpen(false);
  };

  const processedProperties = useMemo(() => {
    if (filters.favorites !== "true") return initialProperties;
    if (favoriteProperties.length > 0) return favoriteProperties;
    if (favoriteIds.length === 0) return [];
    return initialProperties.filter((property) => favoriteIds.includes(property.id));
  }, [initialProperties, filters.favorites, favoriteIds, favoriteProperties]);

  const FilterSidebar = () => (
    <Card className="sticky top-24 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </h2>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-600 hover:bg-slate-100 hover:text-slate-950">
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Keyword / Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input placeholder="e.g. Luxury Pool" className="h-11 bg-white pl-9" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Location / City</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input placeholder="City, area, or address" className="h-11 bg-white pl-9" value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {["AVAILABLE", "SOLD", "RENTED"].map((s) => (
              <Button
                key={s}
                variant={filters.status === s ? "default" : "outline"}
                className={`w-full ${filters.status !== s ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" : "bg-slate-900 text-white shadow-md hover:bg-slate-800"}`}
                onClick={() => handleFilterChange("status", filters.status === s ? "" : s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Property Type</Label>
          <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}>
            <SelectTrigger className="h-11 w-full bg-white text-slate-950">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="HOUSE">House</SelectItem>
              <SelectItem value="APARTMENT">Apartment</SelectItem>
              <SelectItem value="VILLA">Villa</SelectItem>
              <SelectItem value="PLOT">Plot</SelectItem>
              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Featured</Label>
          <Button
            variant={filters.featured === "true" ? "default" : "outline"}
            className={filters.featured === "true" ? "w-full bg-slate-900 text-white hover:bg-slate-800" : "w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"}
            onClick={() => handleFilterChange("featured", filters.featured === "true" ? "" : "true")}
          >
            Featured Properties Only
          </Button>
        </div>

        <div className="space-y-3">
          <Label>Price Range ({siteConfig.currency})</Label>
          <div className="flex items-center gap-3">
            <Input type="number" placeholder="Min" className="h-11 bg-white" value={filters.min} onChange={(e) => handleFilterChange("min", e.target.value)} />
            <span className="text-slate-500">-</span>
            <Input type="number" placeholder="Max" className="h-11 bg-white" value={filters.max} onChange={(e) => handleFilterChange("max", e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Bedrooms</Label>
          <div className="grid grid-cols-4 gap-2">
            {["1", "2", "3", "4+"].map((bhk) => {
              const val = bhk.replace("+", "");
              return (
                <Button key={bhk} variant={filters.bedrooms === val ? "default" : "outline"} className={`w-full ${filters.bedrooms !== val ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" : "bg-slate-900 text-white hover:bg-slate-800"}`} onClick={() => handleFilterChange("bedrooms", filters.bedrooms === val ? "" : val)}>
                  {bhk}
                </Button>
              );
            })}
          </div>
        </div>
        <Button className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => applyFilters()}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Premium listings</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">Explore Available Properties</h1>
          <p className="text-lg text-slate-600">Find verified homes, apartments, villas, and investment properties.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="hidden lg:block w-full lg:w-80 shrink-0">
            <FilterSidebar />
          </aside>

          <main className="flex-1 w-full">
            <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
              <div className="font-medium text-slate-700">Showing {processedProperties.length} properties</div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 justify-center border-slate-300 bg-white text-slate-800 hover:bg-slate-100 lg:hidden sm:flex-none" onClick={() => setIsMobileFiltersOpen(true)}>
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>

                <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 sm:flex-none">
                  <span className="shrink-0 text-sm font-medium text-slate-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value) => {
                    setSortBy(value);
                    applyFilters(value);
                  }}>
                    <SelectTrigger className="h-10 w-full cursor-pointer appearance-none border-0 bg-transparent p-1 text-sm font-semibold text-slate-950 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest First</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {processedProperties.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-slate-200 bg-white p-8 py-24 text-center shadow-sm">
                <div className="bg-slate-50 p-6 rounded-full inline-block mb-2">
                  <Home className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">No properties found</h3>
                <p className="mx-auto max-w-md text-slate-600">
                  {filters.favorites === "true"
                    ? "No favorite properties yet. Click the heart icon on any property to save it here."
                    : "No properties found. Try adjusting filters."}
                </p>
                <Button onClick={clearFilters} variant="outline" className="mt-6 rounded-full px-8">Clear All Filters</Button>
              </motion.div>
            ) : (
              <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {processedProperties.map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <PremiumPropertyCard property={property} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] bg-black/60 lg:hidden" onClick={() => setIsMobileFiltersOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 z-[9999] h-full w-[85vw] max-w-[400px] overflow-y-auto bg-white shadow-2xl lg:hidden">
              <div className="p-4 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                  <X className="w-6 h-6 text-slate-500" />
                </Button>
              </div>
              <div className="px-4 pb-10">
                <FilterSidebar />
                <Button className="w-full mt-6 h-12 shadow-md" onClick={() => applyFilters()}>Show Results</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
