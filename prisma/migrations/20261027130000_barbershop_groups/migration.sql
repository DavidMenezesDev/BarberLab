-- CreateTable
CREATE TABLE "BarbershopGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarbershopGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarbershopGroup_slug_key" ON "BarbershopGroup"("slug");

ALTER TABLE "Barbershop" ADD COLUMN "groupId" TEXT;
CREATE INDEX "Barbershop_groupId_idx" ON "Barbershop"("groupId");
ALTER TABLE "Barbershop" ADD CONSTRAINT "Barbershop_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BarbershopGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
