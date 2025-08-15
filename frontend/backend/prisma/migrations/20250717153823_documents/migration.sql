-- CreateEnum
CREATE TYPE "DocCategory" AS ENUM ('GENERAL_BUSINESS', 'TRADE', 'COMPLIANCE', 'GOVERNMENT', 'CONTRACTS');

-- CreateEnum
CREATE TYPE "DocVisibility" AS ENUM ('PRIVATE', 'SHAREABLE', 'PUBLIC');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocCategory" NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "expiry" TIMESTAMP(3),
    "visibility" "DocVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
