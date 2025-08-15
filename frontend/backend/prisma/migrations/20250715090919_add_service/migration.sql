-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_category" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
