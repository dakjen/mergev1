/*
  Warnings:

  - You are about to drop the column `companyName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "companyName",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "deadlineDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "companyName",
ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "public"."ApprovedLog" (
    "id" TEXT NOT NULL,
    "approvedUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleAssigned" "public"."Role" NOT NULL,
    "companyAssignedId" TEXT,

    CONSTRAINT "ApprovedLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovedLog" ADD CONSTRAINT "ApprovedLog_approvedUserId_fkey" FOREIGN KEY ("approvedUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovedLog" ADD CONSTRAINT "ApprovedLog_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovedLog" ADD CONSTRAINT "ApprovedLog_companyAssignedId_fkey" FOREIGN KEY ("companyAssignedId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
