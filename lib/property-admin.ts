import { propertySchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export function normalizePropertyInput(body: unknown) {
  const parsedBody = body as Record<string, unknown>;
  const parsed = propertySchema.parse({
    ...parsedBody,
    amenities: Array.isArray(parsedBody.amenities)
      ? parsedBody.amenities
      : String(parsedBody.amenities || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    images: Array.isArray(parsedBody.images)
      ? parsedBody.images
      : String(parsedBody.images || "")
          .split("\n")
          .map((url, index) => url.trim() ? { url: url.trim(), publicId: "manual", order: index } : null)
          .filter(Boolean),
  });

  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  const size = parsed.size;

  return {
    ...parsed,
    slug,
    size,
    area: parsed.area || size,
    location: parsed.location || parsed.city,
    state: parsed.state || "",
    zip: parsed.zip || "",
    country: parsed.country || "",
  };
}
