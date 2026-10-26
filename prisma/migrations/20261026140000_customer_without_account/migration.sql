-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- Quem já tinha reserva vira cliente, mantendo o mesmo id.
INSERT INTO "Customer" ("id", "name", "phone", "email", "updatedAt")
SELECT u."id", COALESCE(u."name", 'Cliente'), COALESCE(u."phone", ''), u."email", CURRENT_TIMESTAMP
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "Booking" b WHERE b."userId" = u."id");

-- Booking passa a apontar para Customer.
ALTER TABLE "Booking" ADD COLUMN "customerId" TEXT;
UPDATE "Booking" SET "customerId" = "userId";
ALTER TABLE "Booking" ALTER COLUMN "customerId" SET NOT NULL;

ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";
DROP INDEX "Booking_userId_date_idx";
ALTER TABLE "Booking" DROP COLUMN "userId";

CREATE INDEX "Booking_customerId_date_idx" ON "Booking"("customerId", "date");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
