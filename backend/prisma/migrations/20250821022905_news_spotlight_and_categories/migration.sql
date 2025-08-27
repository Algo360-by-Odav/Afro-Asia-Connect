-- AlterTable
ALTER TABLE "public"."_CompanyOwners" ADD CONSTRAINT "_CompanyOwners_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_CompanyOwners_AB_unique";

-- AlterTable
ALTER TABLE "public"."_ConversationParticipants" ADD CONSTRAINT "_ConversationParticipants_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ConversationParticipants_AB_unique";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "industry_interest" TEXT;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spotlights" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "position" INTEGER NOT NULL,
    "blurb" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "spotlights_date_idx" ON "public"."spotlights"("date");

-- CreateIndex
CREATE INDEX "spotlights_companyId_idx" ON "public"."spotlights"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "spotlights_date_position_key" ON "public"."spotlights"("date", "position");

-- AddForeignKey
ALTER TABLE "public"."spotlights" ADD CONSTRAINT "spotlights_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
