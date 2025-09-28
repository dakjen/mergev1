-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "answer" TEXT;

-- CreateTable
CREATE TABLE "public"."QuestionAssignmentLog" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedToId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionAssignmentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."QuestionAssignmentLog" ADD CONSTRAINT "QuestionAssignmentLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionAssignmentLog" ADD CONSTRAINT "QuestionAssignmentLog_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionAssignmentLog" ADD CONSTRAINT "QuestionAssignmentLog_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
