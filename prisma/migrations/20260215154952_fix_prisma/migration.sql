/*
  Warnings:

  - You are about to drop the column `baseIngredients` on the `ProductOption` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` ADD COLUMN `baseIngredients` JSON NOT NULL;

-- AlterTable
ALTER TABLE `ProductOption` DROP COLUMN `baseIngredients`;
