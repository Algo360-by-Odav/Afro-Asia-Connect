/*
  Warnings:

  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_consultationId_fkey";

-- DropTable
DROP TABLE "Feedback";

-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_keys" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotated_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "conversation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" INTEGER,
    "action" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "resolved_by" INTEGER,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encrypted_messages" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "encrypted_content" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "aad" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encrypted_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_consultationId_key" ON "feedback"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_keys_conversation_id_key" ON "conversation_keys"("conversation_id");

-- CreateIndex
CREATE INDEX "security_audit_logs_user_id_idx" ON "security_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "security_audit_logs_event_type_idx" ON "security_audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "security_audit_logs_timestamp_idx" ON "security_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "security_audit_logs_risk_level_idx" ON "security_audit_logs"("risk_level");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_created_at_idx" ON "security_alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "encrypted_messages_message_id_key" ON "encrypted_messages"("message_id");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_keys" ADD CONSTRAINT "conversation_keys_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encrypted_messages" ADD CONSTRAINT "encrypted_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
