-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'CUSTOMER',
ALTER COLUMN "roleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
