-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN "features" TEXT[] DEFAULT ARRAY['Wi-Fi Gratuito', 'Estacionamento', 'Cartão de Crédito', 'Produtos Premium', 'Ambiente Climatizado', 'Profissionais Qualificados']::TEXT[];

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
