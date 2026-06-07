-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_verification_token_key" ON "User"("email_verification_token");
