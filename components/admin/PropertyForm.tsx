"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link, Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function PropertyForm({ property }: { property?: PropertyFormValue }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [amenitiesText, setAmenitiesText] = useState((property?.amenities || []).join(", "));
  const [existingImages, setExistingImages] = useState(property?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");

  const initialValues = property || emptyProperty;

  const validationRules = {
    title: { required: true, minLength: 3 },
    slug: { required: true, minLength: 2 },
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
        throw new Error(error?.error || "Unable to save property");
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
    <div className="mx-auto max-w-[950px] w-full pb-20">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-slate-200 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
            <CardTitle className="text-xl font-semibold">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-12">
            {/* Row 1: Title | Slug (Half/Half) */}
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">Title</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setTouchedField("title")}
                className={cn("h-11 rounded-lg", errors.title ? "border-red-500" : "border-slate-200")}
                required
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="slug" className="text-sm font-medium text-slate-700">Slug</Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => setValue("slug", slugify(e.target.value))}
                onBlur={() => setTouchedField("slug")}
                className={cn("h-11 rounded-lg", errors.slug ? "border-red-500" : "border-slate-200")}
                required
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            </div>

            {/* Row 2: Price | Purpose | Property Type (One Third Each) */}
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="price" className="text-sm font-medium text-slate-700">Price</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={values.price}
                onChange={(e) => setValue("price", Number(e.target.value))}
                onBlur={() => setTouchedField("price")}
                className={cn("h-11 rounded-lg", errors.price ? "border-red-500" : "border-slate-200")}
                required
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm font-medium text-slate-700">Purpose</Label>
              <Select value={values.purpose} onValueChange={(value) => setValue("purpose", value)}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>
                  {propertyPurposes.map((purpose) => <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm font-medium text-slate-700">Property Type</Label>
              <Select value={values.type} onValueChange={(value) => setValue("type", value)}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Location | City | Status (One Third Each) */}
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="location" className="text-sm font-medium text-slate-700">Location</Label>
              <Input id="location" className="h-11 rounded-lg border-slate-200" value={values.location || ""} onChange={(e) => setValue("location", e.target.value)} placeholder="Area/Locality" />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="city" className="text-sm font-medium text-slate-700">City</Label>
              <Input
                id="city"
                value={values.city}
                onChange={(e) => setValue("city", e.target.value)}
                onBlur={() => setTouchedField("city")}
                className={cn("h-11 rounded-lg", errors.city ? "border-red-500" : "border-slate-200")}
                required
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={values.status} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {propertyStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Full Address (Full Width) */}
            <div className="space-y-2 md:col-span-12">
              <Label htmlFor="address" className="text-sm font-medium text-slate-700">Full Address</Label>
              <Input
                id="address"
                value={values.address}
                onChange={(e) => setValue("address", e.target.value)}
                onBlur={() => setTouchedField("address")}
                className={cn("h-11 rounded-lg", errors.address ? "border-red-500" : "border-slate-200")}
                required
              />
              {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>

            {/* Row 5: Bedrooms | Bathrooms | Size | Featured (One Fourth Each) */}
            <div className="space-y-2 md:col-span-3">
              <Label className="text-sm font-medium text-slate-700">Bedrooms</Label>
              <Input type="number" min={0} className="h-11 rounded-lg border-slate-200" value={values.bedrooms} onChange={(e) => setValue("bedrooms", Number(e.target.value))} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="text-sm font-medium text-slate-700">Bathrooms</Label>
              <Input type="number" min={0} className="h-11 rounded-lg border-slate-200" value={values.bathrooms} onChange={(e) => setValue("bathrooms", Number(e.target.value))} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="text-sm font-medium text-slate-700">Size (sqft)</Label>
              <Input type="number" min={1} className="h-11 rounded-lg border-slate-200" value={values.size || values.area || 0} onChange={(e) => setValue("size", Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 md:col-span-3 pt-8">
              <Checkbox id="featured" checked={values.featured} onCheckedChange={(checked) => setValue("featured", Boolean(checked))} />
              <Label htmlFor="featured" className="text-sm font-medium text-slate-700 cursor-pointer">Mark as Featured</Label>
            </div>

            {/* Row 6: Description (Full Width) */}
            <div className="space-y-2 md:col-span-12">
              <Label className="text-sm font-medium text-slate-700">Description</Label>
              <Textarea
                value={values.description}
                onChange={(e) => setValue("description", e.target.value)}
                className={cn("min-h-32 rounded-lg border-slate-200", errors.description ? "border-red-500" : "")}
                required
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Row 7: Amenities (Full Width) */}
            <div className="space-y-2 md:col-span-12">
              <Label className="text-sm font-medium text-slate-700">Amenities (comma separated)</Label>
              <Input value={amenitiesText} className="h-11 rounded-lg border-slate-200" onChange={(e) => setAmenitiesText(e.target.value)} placeholder="Pool, Parking, Gym" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
            <CardTitle className="text-xl font-semibold">Images (1 to 6)</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Images
                </div>
              </Label>
              <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />
              <div className="text-sm font-medium text-slate-500">
                Selected: <span className={totalImagesCount > 0 ? "text-primary font-bold" : ""}>{totalImagesCount}</span> / 6
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Input
                value={manualImageUrl}
                onChange={(event) => setManualImageUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addManualImageUrl();
                  }
                }}
                className="h-11 rounded-lg border-slate-200"
                placeholder="Paste external image URL"
              />
              <Button type="button" variant="outline" className="h-11 rounded-lg px-6" onClick={addManualImageUrl} disabled={!manualImageUrl.trim()}>
                <Link className="mr-2 h-4 w-4" />
                Add URL
              </Button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Allowed uploads: JPG, PNG, WEBP up to 5MB. External image URLs must be public HTTPS/HTTP links.
            </p>

            {totalImagesCount === 0 && (
              <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">At least one image is required.</p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src={image.url} alt={`Existing ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => removeExistingImage(index)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 shadow-sm hover:bg-red-600 hover:text-white transition-all scale-90 group-hover:scale-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {previews.map((item, index) => (
                <div key={`new-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src={item.preview} alt={`New ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => removeNewFile(index)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 shadow-sm hover:bg-red-600 hover:text-white transition-all scale-90 group-hover:scale-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" className="h-12 px-8 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl" onClick={() => router.push("/admin/properties")}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="h-12 px-10 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isSaving || isUploading}>
            {isSaving || isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isUploading ? "Uploading..." : property?.id ? "Update Property" : "Publish Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
