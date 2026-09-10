-- Privacy, payment accountability, scoped finance access, moderation states,
-- waitlist invitations, and complete member-profile support.
ALTER TABLE "events" ADD COLUMN "maxOtherRegistrations" INTEGER;
ALTER TABLE "users" ADD COLUMN "isMentorAvailable" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_email_case_insensitive_key" ON "users" (LOWER("email")) WHERE "email" IS NOT NULL;

DROP INDEX IF EXISTS "registrations_eventId_userId_key";
CREATE INDEX "registrations_eventId_userId_idx" ON "registrations"("eventId", "userId");
CREATE UNIQUE INDEX "registrations_one_active_per_user_event_key"
  ON "registrations"("eventId", "userId") WHERE "status" = 'active' AND "userId" IS NOT NULL;

ALTER TABLE "event_waitlist"
  ADD COLUMN "invitedAt" TIMESTAMP(3),
  ADD COLUMN "inviteExpiresAt" TIMESTAMP(3);

ALTER TABLE "opportunities"
  ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "moderationReason" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
UPDATE "opportunities" SET "moderationStatus" = CASE WHEN "isApproved" THEN 'approved' ELSE 'pending' END;

ALTER TABLE "business_profiles"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "moderationReason" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
UPDATE "business_profiles" SET "moderationStatus" = CASE WHEN "isApproved" THEN 'approved' ELSE 'pending' END;

CREATE TABLE "event_finance_assignments" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "assignedById" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_finance_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_finance_assignments_eventId_reviewerId_key" ON "event_finance_assignments"("eventId", "reviewerId");
CREATE INDEX "event_finance_assignments_reviewerId_isActive_idx" ON "event_finance_assignments"("reviewerId", "isActive");
ALTER TABLE "event_finance_assignments" ADD CONSTRAINT "event_finance_assignments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_finance_assignments" ADD CONSTRAINT "event_finance_assignments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_finance_assignments" ADD CONSTRAINT "event_finance_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "payment_reviews" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_reviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "payment_reviews_registrationId_createdAt_idx" ON "payment_reviews"("registrationId", "createdAt");
ALTER TABLE "payment_reviews" ADD CONSTRAINT "payment_reviews_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_reviews" ADD CONSTRAINT "payment_reviews_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "refund_requests" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "amount" INTEGER,
  "reason" TEXT,
  "reference" TEXT,
  "reviewedById" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "refund_requests_status_requestedAt_idx" ON "refund_requests"("status", "requestedAt");
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prevent reuse of a manual payment reference without discarding legacy rows.
CREATE UNIQUE INDEX "registrations_manual_payment_reference_key"
  ON "registrations" (LOWER("paymentReference"))
  WHERE "paymentReference" IS NOT NULL AND "paymentReference" <> '' AND "paymentProvider" = 'manual';

ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_status_check" CHECK ("status" IN ('waiting', 'invited', 'joined', 'declined', 'expired'));
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_moderation_status_check" CHECK ("moderationStatus" IN ('pending', 'approved', 'rejected'));
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_moderation_status_check" CHECK ("moderationStatus" IN ('pending', 'approved', 'rejected'));
