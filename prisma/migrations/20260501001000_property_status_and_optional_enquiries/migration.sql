ALTER TYPE "PropertyStatus" RENAME TO "PropertyStatus_old";

CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RENTED', 'DRAFT');

ALTER TABLE "Property"
  ALTER COLUMN "status" TYPE "PropertyStatus"
  USING (
    CASE
      WHEN "status"::text = 'SOLD' THEN 'SOLD'
      ELSE 'AVAILABLE'
    END
  )::"PropertyStatus";

DROP TYPE "PropertyStatus_old";

ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_propertyId_fkey";
ALTER TABLE "Enquiry" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "propertyId" DROP NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "source" SET DEFAULT 'Website Contact';
ALTER TABLE "Enquiry"
  ADD CONSTRAINT "Enquiry_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
