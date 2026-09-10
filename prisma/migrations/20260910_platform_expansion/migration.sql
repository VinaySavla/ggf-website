-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" TEXT,
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "paymentAmount" INTEGER,
ADD COLUMN     "upiId" TEXT,
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "paymentReviewHours" INTEGER NOT NULL DEFAULT 48,
ADD COLUMN     "refundPolicy" TEXT;

-- AlterTable
ALTER TABLE "gallery_collections" ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "attendanceStatus" TEXT NOT NULL DEFAULT 'not_checked_in',
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "paymentMetadata" JSONB,
ADD COLUMN     "paymentProvider" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "ticketCode" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "userId" TEXT;

-- Backfill stable identifiers for existing registrations before enforcing uniqueness.
UPDATE "registrations"
SET "registrationNumber" = 'GGF-LEGACY-' || UPPER(SUBSTRING(MD5("id"), 1, 12))
WHERE "registrationNumber" IS NULL;
ALTER TABLE "registrations" ALTER COLUMN "registrationNumber" SET NOT NULL;

-- Link legacy JSON registrations to users where the historical userId is still valid.
UPDATE "registrations" AS registration
SET "userId" = users."id"
FROM "users" AS users
WHERE registration."userId" IS NULL
  AND registration."userData"->>'userId' = users."id";

-- Preserve the ownership of existing tournament events in the new direct event relation.
UPDATE "events" AS event
SET "organizerId" = tournament."organizerId"
FROM "tournament_masters" AS tournament
WHERE event."id" = tournament."eventId"
  AND event."organizerId" IS NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "education" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isDirectoryVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationPreferences" JSONB NOT NULL DEFAULT '{"email":true,"inApp":true,"eventReminders":true,"communityUpdates":true}',
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "login_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "login_codes_userId_expiresAt_idx" ON "login_codes"("userId", "expiresAt");
ALTER TABLE "login_codes" ADD CONSTRAINT "login_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,

    CONSTRAINT "event_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "fileUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organization" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "applyUrl" TEXT,
    "contactEmail" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_applications" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "hoursLogged" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "winningTeamId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "homeScore" TEXT,
    "awayScore" TEXT,
    "resultNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_stat_definitions" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'number',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sport_stat_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_isActive_publishedAt_idx" ON "announcements"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "announcements_eventId_idx" ON "announcements"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_bookmarks_userId_eventId_key" ON "event_bookmarks"("userId", "eventId");

-- CreateIndex
CREATE INDEX "event_waitlist_eventId_status_position_idx" ON "event_waitlist"("eventId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "event_waitlist_userId_eventId_key" ON "event_waitlist"("userId", "eventId");

-- CreateIndex
CREATE INDEX "event_attendance_eventId_checkedInAt_idx" ON "event_attendance"("eventId", "checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendance_userId_eventId_key" ON "event_attendance"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_feedback_userId_eventId_key" ON "event_feedback"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNumber_key" ON "certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "certificates_userId_issuedAt_idx" ON "certificates"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "opportunities_isApproved_type_createdAt_idx" ON "opportunities"("isApproved", "type", "createdAt");

-- CreateIndex
CREATE INDEX "mentorships_mentorId_status_idx" ON "mentorships"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentorships_menteeId_status_idx" ON "mentorships"("menteeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mentorships_mentorId_menteeId_topic_key" ON "mentorships"("mentorId", "menteeId", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_userId_key" ON "business_profiles"("userId");

-- CreateIndex
CREATE INDEX "business_profiles_isApproved_category_idx" ON "business_profiles"("isApproved", "category");

-- CreateIndex
CREATE INDEX "volunteer_opportunities_isActive_eventDate_idx" ON "volunteer_opportunities"("isActive", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_applications_opportunityId_userId_key" ON "volunteer_applications"("opportunityId", "userId");

-- CreateIndex
CREATE INDEX "tournament_matches_tournamentId_scheduledAt_idx" ON "tournament_matches"("tournamentId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "sport_stat_definitions_sportId_key_key" ON "sport_stat_definitions"("sportId", "key");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_updatedAt_idx" ON "rate_limit_buckets"("updatedAt");

-- CreateIndex
CREATE INDEX "events_isActive_eventDate_idx" ON "events"("isActive", "eventDate");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "events"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registrationNumber_key" ON "registrations"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_ticketCode_key" ON "registrations"("ticketCode");

-- CreateIndex
CREATE INDEX "registrations_eventId_status_paymentStatus_idx" ON "registrations"("eventId", "status", "paymentStatus");

-- CreateIndex
CREATE INDEX "registrations_userId_createdAt_idx" ON "registrations"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_eventId_userId_key" ON "registrations"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_collections" ADD CONSTRAINT "gallery_collections_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookmarks" ADD CONSTRAINT "event_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookmarks" ADD CONSTRAINT "event_bookmarks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "volunteer_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winningTeamId_fkey" FOREIGN KEY ("winningTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_stat_definitions" ADD CONSTRAINT "sport_stat_definitions_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
