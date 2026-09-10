CREATE TABLE "member_blocks" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_blocks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "member_blocks_blockerId_blockedId_key" ON "member_blocks"("blockerId", "blockedId");
CREATE INDEX "member_blocks_blockedId_idx" ON "member_blocks"("blockedId");
ALTER TABLE "member_blocks" ADD CONSTRAINT "member_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_blocks" ADD CONSTRAINT "member_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "community_reports" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "subjectUserId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "community_reports_status_createdAt_idx" ON "community_reports"("status", "createdAt");
CREATE INDEX "community_reports_subjectUserId_createdAt_idx" ON "community_reports"("subjectUserId", "createdAt");
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_category_check" CHECK ("category" IN ('spam', 'harassment', 'misrepresentation', 'other'));
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_status_check" CHECK ("status" IN ('open', 'resolved', 'dismissed'));
