import { User, Property, Image, Enquiry, UserRole, PropertyStatus, PropertyType } from "@prisma/client";

export type { User, Property, Image, Enquiry };
export { UserRole, PropertyStatus, PropertyType };

export type SafeUser = Omit<User, "password"> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeProperty = Omit<Property, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  images: Image[];
  author: SafeUser;
};

export type SafeEnquiry = Omit<Enquiry, "createdAt"> & {
  createdAt: string;
};

export interface PropertyFilters {
  city?: string;
  status?: PropertyStatus;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}
