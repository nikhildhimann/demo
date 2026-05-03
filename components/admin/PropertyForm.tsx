"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormValidation } from "@/hooks/useFormValidation";

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
  images: { url: string; publicId?: string; order?: number }[];
  featured: boolean;
  status: string;
  state?: string;
  zip?: string;
  country?: string;
};

const propertyTypes = ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL"];
const propertyStatuses = ["AVAILABLE", "SOLD", "RENTED", "DRAFT"];
const propertyPurposes = ["BUY", "RENT", "SELL"];

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
  country: "",
};

export function PropertyForm({ property }: { property?: PropertyFormValue }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [amenitiesText, setAmenitiesText] = useState((property?.amenities || []).join(", "));
  const [existingImages, setExistingImages] = useState(property?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);

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

    const allowed = files.filter((file) => file.type.startsWith("image/"));
    if (allowed.length !== files.length) {
      toast.error("Only image files are allowed.");
    }

    const remaining = 6 - (existingImages.length + newFiles.length);
    if (remaining <= 0) {
      toast.error("Maximum 6 images are allowed.");
      return;
    }

    setNewFiles((prev) => [...prev, ...allowed.slice(0, remaining)]);
    event.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewFiles = async () => {
    if (newFiles.length === 0) return [] as { url: string; publicId?: string; order?: number }[];

    setIsUploading(true);
    try {
      const uploaded: { url: string; publicId?: string; order?: number }[] = [];

      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Image upload failed");
        }

        const result = await response.json();
        uploaded.push({
          url: result.secure_url || result.url,
          publicId: result.public_id || "manual",
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
        publicId: image.publicId || "manual",
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setTouchedField("title")}
              className={errors.title ? "border-red-500" : ""}
              required
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => setValue("slug", slugify(e.target.value))}
              onBlur={() => setTouchedField("slug")}
              className={errors.slug ? "border-red-500" : ""}
              required
            />
            {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => setValue("price", Number(e.target.value))}
              onBlur={() => setTouchedField("price")}
              className={errors.price ? "border-red-500" : ""}
              required
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select value={values.purpose} onValueChange={(value) => setValue("purpose", value)}>
              <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                {propertyPurposes.map((purpose) => <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Property Type</Label>
            <Select value={values.type} onValueChange={(value) => setValue("type", value)}>
              <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={values.location || ""} onChange={(e) => setValue("location", e.target.value)} placeholder="Area/Locality" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(e) => setValue("city", e.target.value)}
              onBlur={() => setTouchedField("city")}
              className={errors.city ? "border-red-500" : ""}
              required
            />
            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Full Address</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => setValue("address", e.target.value)}
              onBlur={() => setTouchedField("address")}
              className={errors.address ? "border-red-500" : ""}
              required
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label>Bedrooms</Label>
            <Input type="number" min={0} value={values.bedrooms} onChange={(e) => setValue("bedrooms", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Bathrooms</Label>
            <Input type="number" min={0} value={values.bathrooms} onChange={(e) => setValue("bathrooms", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <Input type="number" min={1} value={values.size || values.area || 0} onChange={(e) => setValue("size", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(value) => setValue("status", value)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {propertyStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-7">
            <Checkbox id="featured" checked={values.featured} onCheckedChange={(checked) => setValue("featured", Boolean(checked))} />
            <Label htmlFor="featured">Mark as Featured</Label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={values.description}
              onChange={(e) => setValue("description", e.target.value)}
              className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
              required
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Amenities (comma separated)</Label>
            <Input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="Pool, Parking, Gym" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images (1 to 6)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                <Upload className="h-4 w-4" />
                Upload Images
              </div>
            </Label>
            <input id="image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <p className="text-sm text-muted-foreground">Selected: {totalImagesCount}/6</p>
          </div>

          {totalImagesCount === 0 && (
            <p className="text-sm text-red-500">At least one image is required.</p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative overflow-hidden rounded-lg border">
                <Image src={image.url} alt={`Existing ${index + 1}`} width={400} height={260} className="h-32 w-full object-cover" unoptimized />
                <button type="button" onClick={() => removeExistingImage(index)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previews.map((item, index) => (
              <div key={`new-${index}`} className="relative overflow-hidden rounded-lg border">
                <Image src={item.preview} alt={`New ${index + 1}`} width={400} height={260} className="h-32 w-full object-cover" unoptimized />
                <button type="button" onClick={() => removeNewFile(index)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/properties")}>Cancel</Button>
        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isUploading ? "Uploading Images..." : "Save Property"}
        </Button>
      </div>
    </form>
  );
}
