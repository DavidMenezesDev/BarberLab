-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'BARBER');

-- Quem já administrava uma barbearia vira dono.
ALTER TABLE "User" ADD COLUMN "staffRole" "StaffRole";
UPDATE "User" SET "staffRole" = 'OWNER' WHERE "role" = 'BARBER_ADMIN' AND "barbershopId" IS NOT NULL;

-- Slug único por barbearia; as existentes recebem um com sufixo do id.
ALTER TABLE "Barbershop" ADD COLUMN "slug" TEXT;
UPDATE "Barbershop"
SET "slug" = COALESCE(NULLIF(trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')), ''), 'barbearia')
  || '-' || substr(replace("id", '-', ''), 1, 6);
ALTER TABLE "Barbershop" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Barbershop_slug_key" ON "Barbershop"("slug");

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'BARBER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffInvite_token_key" ON "StaffInvite"("token");
CREATE INDEX "StaffInvite_barbershopId_idx" ON "StaffInvite"("barbershopId");
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
