-- CreateTable
CREATE TABLE "public"."AIReviewLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "grantWebsite" TEXT,
    "grantPurposeStatement" TEXT,

    CONSTRAINT "AIReviewLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AIReviewLog" ADD CONSTRAINT "AIReviewLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIReviewLog" ADD CONSTRAINT "AIReviewLog_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
