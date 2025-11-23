/*
  Warnings:

  - You are about to drop the `ProductImage` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "images" TEXT[],
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT;

-- DropTable
DROP TABLE "ProductImage";
