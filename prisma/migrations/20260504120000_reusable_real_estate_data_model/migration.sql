-- Phase 1: align Prisma schema with the reusable real-estate data model.

-- Keep only admin users. Public user accounts are not part of this product.
DELETE FROM "Session"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role"::text <> 'ADMIN');

DELETE FROM "Account"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role"::text <> 'ADMIN');

DELETE FROM "User"
WHERE "role"::text <> 'ADMIN';

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole"
  USING 'ADMIN'::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'ADMIN';

DROP TYPE "UserRole_old";

-- Property type and purpose support.
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'TOWNHOUSE';
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'LAND';
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'PLOT';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyPurpose') THEN
    CREATE TYPE "PropertyPurpose" AS ENUM ('BUY', 'RENT', 'SELL');
  END IF;
END
$$;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "purpose" "PropertyPurpose" NOT NULL DEFAULT 'BUY',
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "suburb" TEXT,
  ADD COLUMN IF NOT EXISTS "zipCode" TEXT;

UPDATE "Property"
SET
  "location" = COALESCE("location", "city"),
  "zipCode" = COALESCE("zipCode", "zip")
WHERE "location" IS NULL OR "zipCode" IS NULL;

-- Replace the old enquiry status enum with a growth-system lead status enum.
ALTER TYPE "EnquiryStatus" RENAME TO "EnquiryStatus_old";

CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'SITE_VISIT',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
  'SPAM'
);

ALTER TABLE "Enquiry"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus"
  USING (
    CASE
      WHEN "status"::text = 'NEW' THEN 'NEW'
      WHEN "status"::text = 'CONTACTED' THEN 'CONTACTED'
      WHEN "status"::text = 'CLOSED' THEN 'LOST'
      ELSE 'NEW'
    END
  )::"LeadStatus",
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "EnquiryStatus_old";

CREATE TYPE "LeadPriority" AS ENUM ('HOT', 'WARM', 'COLD');

ALTER TABLE "Enquiry"
  ADD COLUMN IF NOT EXISTS "priority" "LeadPriority" NOT NULL DEFAULT 'WARM',
  ADD COLUMN IF NOT EXISTS "budget" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredType" TEXT,
  ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3);

UPDATE "Enquiry"
SET
  "budget" = COALESCE("budget", "interestBudget"),
  "preferredLocation" = COALESCE("preferredLocation", "interestLocation"),
  "preferredType" = COALESCE("preferredType", "interestPropertyType");

-- Persistent business/site settings.
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "tagline" TEXT,
  "phone" TEXT,
  "whatsappNumber" TEXT,
  "email" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "primaryDomain" TEXT,
  "facebookUrl" TEXT,
  "twitterUrl" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "youtubeUrl" TEXT,
  "defaultSeoTitle" TEXT,
  "defaultSeoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Property_status_idx" ON "Property"("status");
CREATE INDEX IF NOT EXISTS "Property_type_idx" ON "Property"("type");
CREATE INDEX IF NOT EXISTS "Property_purpose_idx" ON "Property"("purpose");
CREATE INDEX IF NOT EXISTS "Property_city_idx" ON "Property"("city");
CREATE INDEX IF NOT EXISTS "Property_location_idx" ON "Property"("location");
CREATE INDEX IF NOT EXISTS "Property_featured_idx" ON "Property"("featured");
CREATE INDEX IF NOT EXISTS "Property_deletedAt_idx" ON "Property"("deletedAt");

CREATE INDEX IF NOT EXISTS "Enquiry_status_idx" ON "Enquiry"("status");
CREATE INDEX IF NOT EXISTS "Enquiry_priority_idx" ON "Enquiry"("priority");
CREATE INDEX IF NOT EXISTS "Enquiry_source_idx" ON "Enquiry"("source");
CREATE INDEX IF NOT EXISTS "Enquiry_propertyId_idx" ON "Enquiry"("propertyId");
CREATE INDEX IF NOT EXISTS "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
CREATE INDEX IF NOT EXISTS "Enquiry_followUpDate_idx" ON "Enquiry"("followUpDate");
