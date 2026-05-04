-- Add new property enum value and fields required by admin workflow
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
ADD COLUMN IF NOT EXISTS "location" TEXT;

UPDATE "Property"
SET "location" = COALESCE("location", "city")
WHERE "location" IS NULL;
