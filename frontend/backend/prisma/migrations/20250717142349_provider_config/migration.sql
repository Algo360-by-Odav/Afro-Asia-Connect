-- CreateTable
CREATE TABLE "ProviderConfig" (
    "providerId" INTEGER NOT NULL,
    "allowUrgent" BOOLEAN NOT NULL DEFAULT false,
    "unavailableDates" JSONB,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("providerId")
);

-- AddForeignKey
ALTER TABLE "ProviderConfig" ADD CONSTRAINT "ProviderConfig_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
