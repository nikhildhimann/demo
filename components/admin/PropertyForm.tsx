"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bath, Bed, Link, Loader2, MapPin, Save, Square, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFormValidation } from "@/hooks/useFormValidation";
import { cn } from "@/lib/utils";

type PropertyFormValue = {
  id?: string;
  title: string;
  slug: string;
  price: number;
  purpose?: string;
  location?: string | null;
  city: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  size?: number | null;
  area: number;
  description: string;
  amenities: string[];
  images: { url: string; publicId?: string | null; order?: number }[];
  featured: boolean;
  status: string;
  state?: string;
  zip?: string;
  zipCode?: string | null;
  country?: string;
};

type ValidationIssue = {
  message?: string;
  path?: (string | number)[];
};

const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "TOWNHOUSE", "COMMERCIAL", "LAND", "PLOT"];
const propertyStatuses = ["AVAILABLE", "SOLD", "RENTED", "DRAFT"];
const propertyPurposes = ["BUY", "RENT", "SELL"];
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function getPropertySaveError(error: any) {
  if (Array.isArray(error?.issues) && error.issues.length > 0) {
    return error.issues
      .map((issue: ValidationIssue) => {
        const field = issue.path?.[0] ? `${issue.path[0]}: ` : "";
        return `${field}${issue.message || "Invalid value"}`;
      })
      .join("\n");
  }

  return error?.error || "Unable to save property";
}

const emptyProperty: PropertyFormValue = {
  title: "",
  slug: "",
  price: 0,
  purpose: "BUY",
  location: "",
  city: "",
  address: "",
  type: "APARTMENT",
  bedrooms: 0,
  bathrooms: 0,
  size: 0,
  area: 0,
  description: "",
  amenities: [],
  images: [],
  featured: false,
  status: "AVAILABLE",
  state: "",
  zip: "",
  zipCode: "",
  country: "",
};

export function PropertyForm({ property, currency = "AUD" }: { property?: PropertyFormValue; currency?: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [amenitiesText, setAmenitiesText] = useState((property?.amenities || []).join(", "));
  const [existingImages, setExistingImages] = useState(property?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");

  const initialValues = property || emptyProperty;

  const validationRules = {
    title: { required: true, minLength: 5 },
    slug: { required: true, minLength: 3 },
    price: { required: true, min: 1 },
    city: { required: true, minLength: 2 },
    address: { required: true, minLength: 5 },
    type: { required: true },
    purpose: { required: true },
    status: { required: true },
    bedrooms: { required: true, min: 0 },
    bathrooms: { required: true, min: 0 },
    size: { required: true, min: 1 },
    description: { required: true, minLength: 20 },
  };

  const { values, errors, setValue, setTouchedField, validateAll } = useFormValidation(
    initialValues,
    validationRules
  );

  const totalImagesCount = existingImages.length + newFiles.length;

  const autoSlug = useMemo(() => slugify(values.title), [values.title]);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }), [currency]);

  const previews = useMemo(
    () => newFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [newFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [previews]);

  const handleTitleChange = (value: string) => {
    setValue("title", value);
    if (!values.slug || values.slug === autoSlug) {
      setValue("slug", slugify(value));
    }
  };

  const handleStatusChange = (status: string) => {
    setValue("status", status);
    if (status !== "AVAILABLE" && values.featured) {
      setValue("featured", false);
      toast.info("Only available properties can be featured.");
    }
  };

  const handleFeaturedChange = (checked: boolean) => {
    if (checked && values.status !== "AVAILABLE") {
      toast.error("Only available properties can be featured.");
      return;
    }

    setValue("featured", checked);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowed = files.filter((file) => allowedImageTypes.includes(file.type) && file.size <= maxImageSize);
    if (allowed.length !== files.length) {
      toast.error("Only JPG, PNG, and WEBP images up to 5MB are allowed.");
    }

    const remaining = 6 - (existingImages.length + newFiles.length);
    if (remaining <= 0) {
      toast.error("Maximum 6 images are allowed.");
      event.target.value = "";
      return;
    }

    setNewFiles((prev) => [...prev, ...allowed.slice(0, remaining)]);
    event.target.value = "";
  };

  const addManualImageUrl = () => {
    const value = manualImageUrl.trim();

    if (totalImagesCount >= 6) {
      toast.error("Maximum 6 images are allowed.");
      return;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid image URL");
      }

      setExistingImages((prev) => [...prev, { url: url.toString(), order: prev.length }]);
      setManualImageUrl("");
      toast.success("Image URL added");
    } catch {
      toast.error("Enter a valid image URL starting with http:// or https://");
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewFiles = async () => {
    if (newFiles.length === 0) return [] as { url: string; order?: number }[];

    setIsUploading(true);
    try {
      const uploaded: { url: string; order?: number }[] = [];

      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || "Image upload failed");
        }

        const result = await response.json();
        uploaded.push({
          url: result.secure_url || result.url,
        });
      }

      return uploaded;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateAll()) {
      toast.error("Please fix the validation errors");
      return;
    }

    if (totalImagesCount < 1) {
      toast.error("At least one image is required");
      return;
    }

    if (totalImagesCount > 6) {
      toast.error("Maximum 6 images are allowed");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedImages = await uploadNewFiles();
      const mergedImages = [...existingImages, ...uploadedImages].slice(0, 6).map((image, index) => ({
        url: image.url,
        order: index,
      }));

      const payload = {
        ...values,
        slug: values.slug || slugify(values.title),
        area: Number(values.size || values.area),
        size: Number(values.size || values.area),
        price: Number(values.price),
        location: values.location || values.city,
        amenities: amenitiesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        images: mergedImages,
      };

      const response = await fetch(property?.id ? `/api/admin/properties/${property.id}` : "/api/admin/properties", {
        method: property?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(getPropertySaveError(error));
      }

      toast.success(property?.id ? "Property updated" : "Property created");
      router.push("/admin/properties");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save property");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left Column: Form Sections */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 min-w-0">
          {/* Row 1: Basic Details + Location side by side on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Section 1: Basic Details */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b px-5 py-3">
                <CardTitle className="text-base font-bold text-slate-900">Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold text-slate-700">Property Title</Label>
                      <Input
                        id="title"
                        placeholder="Luxury Villa with Pool"
                        value={values.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onBlur={() => setTouchedField("title")}
                        className={cn("h-10 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.title ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                        required
                      />
                      {errors.title && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="slug" className="text-xs font-semibold text-slate-700">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="luxury-villa-with-pool"
                        value={values.slug}
                        onChange={(e) => setValue("slug", slugify(e.target.value))}
                        onBlur={() => setTouchedField("slug")}
                        className={cn("h-10 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.slug ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                        required
                      />
                      {errors.slug && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.slug}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="price" className="text-xs font-semibold text-slate-700">Price {currency ? `(${currency})` : ""}</Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        placeholder="500000"
                        value={values.price}
                        onChange={(e) => setValue("price", Number(e.target.value))}
                        onBlur={() => setTouchedField("price")}
                        className={cn("h-10 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.price ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                        required
                      />
                      {errors.price && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.price}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Property Type</Label>
                      <Select value={values.type} onValueChange={(value) => setValue("type", value)}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-200 transition-all focus:ring-2 focus:ring-primary/20 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Purpose</Label>
                    <Select value={values.purpose} onValueChange={(value) => setValue("purpose", value)}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 transition-all focus:ring-2 focus:ring-primary/20 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyPurposes.map((purpose) => <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Location */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b px-5 py-3">
                <CardTitle className="text-base font-bold text-slate-900">Location</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-semibold text-slate-700">Locality/Area</Label>
                    <Input id="location" placeholder="Beverly Hills" className="h-10 rounded-lg border-slate-200 transition-all focus:ring-2 focus:ring-primary/20 text-sm" value={values.location || ""} onChange={(e) => setValue("location", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold text-slate-700">City</Label>
                    <Input
                      id="city"
                      placeholder="Los Angeles"
                      value={values.city}
                      onChange={(e) => setValue("city", e.target.value)}
                      onBlur={() => setTouchedField("city")}
                      className={cn("h-10 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.city ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                      required
                    />
                    {errors.city && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.city}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Status</Label>
                    <Select value={values.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-10 rounded-lg border-slate-200 transition-all focus:ring-2 focus:ring-primary/20 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-semibold text-slate-700">Full Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Luxury Lane, Beverly Hills, CA 90210"
                      value={values.address}
                      onChange={(e) => setValue("address", e.target.value)}
                      onBlur={() => setTouchedField("address")}
                      className={cn("h-10 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.address ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                      required
                    />
                    {errors.address && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.address}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Property Specs + Description side by side on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Section 3: Property Specs */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b px-5 py-3">
                <CardTitle className="text-base font-bold text-slate-900">Property Specs</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Bedrooms</Label>
                    <Input type="number" min={0} className="h-10 rounded-lg border-slate-200 text-sm" value={values.bedrooms} onChange={(e) => setValue("bedrooms", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Bathrooms</Label>
                    <Input type="number" min={0} className="h-10 rounded-lg border-slate-200 text-sm" value={values.bathrooms} onChange={(e) => setValue("bathrooms", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Size (sqft)</Label>
                    <Input type="number" min={1} className="h-10 rounded-lg border-slate-200 text-sm" value={values.size || values.area || 0} onChange={(e) => setValue("size", Number(e.target.value))} />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors w-full">
                      <Checkbox id="featured" checked={values.featured} onCheckedChange={(checked) => handleFeaturedChange(Boolean(checked))} />
                      <Label htmlFor="featured" className="text-xs font-semibold text-slate-700 cursor-pointer">Featured Listing</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Description & Amenities */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b px-5 py-3">
                <CardTitle className="text-base font-bold text-slate-900">Description & Amenities</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Description</Label>
                  <Textarea
                    placeholder="Describe your property in detail..."
                    value={values.description}
                    onChange={(e) => setValue("description", e.target.value)}
                    className={cn("min-h-20 max-h-40 rounded-lg transition-all focus:ring-2 focus:ring-primary/20 text-sm", errors.description ? "border-red-500 bg-red-50/30" : "border-slate-200")}
                    required
                  />
                  {errors.description && <p className="text-[10px] font-medium text-red-500 ml-1">{errors.description}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Amenities</Label>
                  <Input value={amenitiesText} className="h-10 rounded-lg border-slate-200 text-sm" onChange={(e) => setAmenitiesText(e.target.value)} placeholder="Pool, Parking, Gym..." />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Images (Full Width) */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b px-5 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">Images (1 to 6)</CardTitle>
                <div className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 border border-slate-200">
                  <span className={totalImagesCount > 0 ? "text-primary" : ""}>{totalImagesCount}</span> / 6
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-slate-700">Local Upload</Label>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 px-4 py-5 hover:bg-slate-50/50 hover:border-primary/50 transition-all group">
                        <div className="rounded-full bg-slate-50 p-2 group-hover:bg-primary/10 transition-colors">
                          <Upload className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-900">Click to upload</p>
                          <p className="text-[10px] text-slate-500">JPG, PNG, WEBP (max 5MB)</p>
                        </div>
                      </div>
                    </Label>
                    <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-slate-700">External URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={manualImageUrl}
                        onChange={(event) => setManualImageUrl(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addManualImageUrl();
                          }
                        }}
                        className="h-10 rounded-lg border-slate-200 transition-all focus:ring-2 focus:ring-primary/20 text-sm"
                        placeholder="Paste image URL here..."
                      />
                      <Button type="button" variant="outline" className="h-10 rounded-lg px-3 shrink-0 hover:bg-slate-50" onClick={addManualImageUrl} disabled={!manualImageUrl.trim()}>
                        <Link className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">External image URLs must be public links.</p>
                  </div>
                </div>
              </div>

              {totalImagesCount === 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <X className="h-3.5 w-3.5" />
                  At least one image is required.
                </div>
              )}

              {totalImagesCount > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <Image src={image.url} alt={`Existing ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeExistingImage(index)} className="rounded-full bg-white p-1.5 text-red-600 shadow-xl hover:scale-110 transition-transform">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {previews.map((item, index) => (
                    <div key={`new-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <Image src={item.preview} alt={`New ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeNewFile(index)} className="rounded-full bg-white p-1.5 text-red-600 shadow-xl hover:scale-110 transition-transform">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" className="h-10 px-6 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all text-sm" onClick={() => router.push("/admin/properties")}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="h-10 px-8 rounded-xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 text-sm" disabled={isSaving || isUploading}>
              {isSaving || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isUploading ? "Uploading..." : property?.id ? "Update Listing" : "Publish Listing"}
            </Button>
          </div>
        </form>

        {/* Right Column: Sticky Live Preview */}
        <div className="w-full lg:w-[350px] lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</h3>
            <span className="text-[10px] font-medium text-slate-400">Updates before publishing</span>
          </div>

          <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden group">
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              {(existingImages[0]?.url || previews[0]?.preview) ? (
                <Image
                  src={existingImages[0]?.url || previews[0]?.preview}
                  alt="Preview"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                  <Upload className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-[10px] font-bold">No images yet</p>
                </div>
              )}

              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <Badge className="bg-white/95 text-slate-900 border-none shadow-sm backdrop-blur font-bold text-[10px] h-6 px-2">
                  {values.purpose}
                </Badge>
                {values.featured && (
                  <Badge className="bg-amber-400 text-amber-950 border-none shadow-sm font-bold text-[10px] h-6 px-2">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="absolute top-3 right-3">
                <Badge className={cn("border-none shadow-sm font-bold text-[10px] h-6 px-2", 
                  values.status === "AVAILABLE" ? "bg-emerald-500 text-white" : "bg-slate-700 text-white")}>
                  {values.status}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary text-base font-black tracking-tight">
                  {currencyFormatter.format(values.price || 0)}
                  {values.purpose === "RENT" && <span className="text-[10px] font-bold text-slate-400">/ month</span>}
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">
                  {values.title || "Property Title"}
                </h4>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <p className="text-[10px] font-semibold truncate">
                    {values.city ? `${values.city}${values.location ? `, ${values.location}` : ''}` : "City, Location"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 border-y border-slate-100 py-2.5">
                <div className="flex flex-col items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-600">{values.bedrooms || 0} Beds</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-slate-100 px-1">
                  <Bath className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-600">{values.bathrooms || 0} Baths</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-600">{values.size || values.area || 0} sqft</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-400 uppercase tracking-widest px-2">
                  {values.type}
                </Badge>
                <span className="text-[9px] font-bold text-slate-200 tracking-tighter">LISTING #NEW</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
